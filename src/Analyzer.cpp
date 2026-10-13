#include "Analyzer.hpp"

#include <algorithm>
#include <climits>
#include <map>

#include "Overlay.hpp"
#include "Session.hpp"

using namespace geode::prelude;

namespace fp {

namespace {

// Reuse the previous checkpoint when the next input is at most this many
// ticks further; making a checkpoint is more expensive than a few extra steps.
constexpr int kReuseGap = 30;
// Give up if the game stops advancing for this many update calls in a row.
constexpr int kMaxStalls = 2000;

template <class T>
T setting(char const* key) {
    return Mod::get()->getSettingValue<T>(key);
}

}

Analyzer& Analyzer::get() {
    static Analyzer a;
    return a;
}

void setAudioMuted(bool muted) {
#ifdef GEODE_IS_IOS
    // FMOD is linked statically into GD on iOS, mods can't call it.
    (void)muted;
#else
    auto engine = FMODAudioEngine::sharedEngine();
    if (!engine || !engine->m_system) return;
    FMOD::ChannelGroup* master = nullptr;
    if (engine->m_system->getMasterChannelGroup(&master) == FMOD_OK && master) {
        master->setMute(muted);
    }
#endif
}

// ---------------------------------------------------------------------------
// Setup

bool Analyzer::begin(PlayLayer* pl, std::string& error) {
    auto& s = Session::get();
    if (!s.hasMacro || s.macro.inputs.empty()) {
        error = "There is no macro for this level yet.\nTap <cg>Record</c> and beat the level first.";
        return false;
    }

    int minFps = static_cast<int>(std::clamp<int64_t>(setting<int64_t>("min-fps"), 1, kTps));
    m_maxWindow = std::max(1, kTps / minFps);
    m_horizon = static_cast<int>(std::clamp<int64_t>(setting<int64_t>("horizon"), 12, 2400));
    m_fastConverge = setting<bool>("fast-converge");
    bool releases = setting<bool>("analyze-releases");

    auto const& in = s.macro.inputs;
    int n = static_cast<int>(in.size());
    m_targets.clear();
    m_prevSame.assign(n, INT_MIN);
    m_nextSame.assign(n, INT_MAX);
    m_pair.assign(n, -1);

    std::map<std::pair<int, bool>, int> last;
    for (int i = 0; i < n; i++) {
        auto key = std::make_pair(in[i].button, in[i].p1);
        auto it = last.find(key);
        if (it != last.end()) {
            int j = it->second;
            m_prevSame[i] = in[j].tick;
            m_nextSame[j] = in[i].tick;
            if (in[j].down && !in[i].down) m_pair[j] = i;
        }
        last[key] = i;
        if (in[i].down || releases) m_targets.push_back(i);
    }
    if (m_targets.empty()) {
        error = "The macro has no inputs to analyse.";
        return false;
    }

    s.analysis = {};
    s.analysis.maxWindow = m_maxWindow;
    s.analysis.horizon = m_horizon;
    s.analysis.results.reserve(m_targets.size());
    s.hasAnalysis = false;
    s.mode = Mode::Analyzing;

    m_cur = 0;
    m_rescueFor = -1;
    m_noProgress = 0;
    m_wasPractice = pl->m_isPracticeMode;
    m_startTime = std::chrono::steady_clock::now();

    setAudioMuted(true);
    if (!pl->m_isPracticeMode) pl->togglePracticeMode(true);
    restartFromStart(pl);
    overlay::rebuildMarkers(pl);
    return true;
}

void Analyzer::restartFromStart(PlayLayer* pl) {
    auto& s = Session::get();
    m_cp.swap(nullptr);
    m_atCP = false;
    pl->removeAllCheckpoints();
    s.died = false;
    s.levelEnded = false;
    pl->resetLevelFromStart();
    s.feeder.reset(&s.macro.inputs);
    m_phase = Phase::Starting;
}

// ---------------------------------------------------------------------------
// Low level: stepping, checkpoints, state snapshots

bool Analyzer::step(PlayLayer* pl) {
    auto& s = Session::get();
    auto before = s.stepsRun;
    // We are inside our own update hook, so this goes straight to the game's
    // update: with a 1/240s delta it runs exactly one physics step.
    pl->GJBaseGameLayer::update(1.f / kTps);
    bool advanced = s.stepsRun != before;
    if (advanced) {
        m_atCP = false;
        m_noProgress = 0;
    }
    else {
        m_noProgress++;
    }
    return advanced;
}

bool Analyzer::makeCheckpoint(PlayLayer* pl) {
    auto& s = Session::get();
    pl->removeAllCheckpoints();
    auto cp = pl->createCheckpoint();
    if (!cp) return false;
    s.allowCheckpointStore = true;
    pl->storeCheckpoint(cp);
    s.allowCheckpointStore = false;
    m_cp.swap(cp);
    m_cpApplied = s.feeder.lastApplied;
    m_cpProgress = static_cast<int>(cp->m_gameState.m_currentProgress);
    m_cpHeld = heldAfter(s.macro.inputs, m_cpApplied);
    // The live state still has the real (continuous) button holds, while
    // every probe starts from a restore + re-press. Force a restore before
    // the first probe so all runs start identically.
    m_atCP = false;
    return true;
}

bool Analyzer::restoreCheckpoint(PlayLayer* pl) {
    auto& s = Session::get();
    s.died = false;
    s.levelEnded = false;
    if (!m_atCP) {
        if (!m_cp) return false;
        pl->resetLevel();
        if (static_cast<int>(pl->m_gameState.m_currentProgress) != m_cpProgress) {
            log::warn("Checkpoint restore landed on {} instead of {}",
                pl->m_gameState.m_currentProgress, m_cpProgress);
            return false;
        }
    }
    s.feeder.reset(&s.macro.inputs);
    s.feeder.lastApplied = m_cpApplied;
    s.feeder.syncInputs = syncTo(s.macro, m_cpHeld);
    m_atCP = true;
    return true;
}

Analyzer::Snap Analyzer::snapshot(PlayLayer* pl) const {
    auto grab = [](PlayerObject* p) {
        PlayerSnap ps;
        if (!p) return ps;
        ps.x = p->m_position.x;
        ps.y = p->m_position.y;
        ps.yVel = p->m_yVelocity;
        ps.xVel = p->m_platformerXVelocity;
        ps.size = p->m_vehicleSize;
        ps.upsideDown = p->m_isUpsideDown;
        ps.ship = p->m_isShip;
        ps.bird = p->m_isBird;
        ps.ball = p->m_isBall;
        ps.dart = p->m_isDart;
        ps.robot = p->m_isRobot;
        ps.spider = p->m_isSpider;
        ps.swing = p->m_isSwing;
        ps.onGround = p->m_isOnGround;
        ps.goingLeft = p->m_isGoingLeft;
        return ps;
    };
    Snap snap;
    snap.p1 = grab(pl->m_player1);
    if (pl->m_gameState.m_isDualMode) snap.p2 = grab(pl->m_player2);
    snap.valid = true;
    return snap;
}

// ---------------------------------------------------------------------------
// Driver

void Analyzer::drive(PlayLayer* pl) {
    if (m_phase == Phase::Off) return;
    auto& s = Session::get();

    auto budget = std::chrono::milliseconds(std::clamp<int64_t>(setting<int64_t>("budget-ms"), 2, 200));
    auto start = std::chrono::steady_clock::now();

    while (m_phase != Phase::Off && std::chrono::steady_clock::now() - start < budget) {
        if (m_noProgress > kMaxStalls) {
            finish(pl, false, "The game stopped advancing during analysis.");
            break;
        }
        switch (m_phase) {
            case Phase::Starting: {
                step(pl);
                if (s.feeder.lastApplied >= 0) {
                    m_phase = Phase::Main;
                    break;
                }
                // The level hasn't started ticking yet; wait for the next frame.
                overlay::updateHud(pl, statusText());
                return;
            }
            case Phase::Main: mainTick(pl); break;
            case Phase::Probing: probeTick(pl); break;
            case Phase::Off: break;
        }
    }

    if (m_phase != Phase::Off) overlay::updateHud(pl, statusText());
}

void Analyzer::mainTick(PlayLayer* pl) {
    auto& s = Session::get();
    if (m_cur >= m_targets.size()) {
        finish(pl, true, "");
        return;
    }

    auto const& in = s.macro.inputs[m_targets[m_cur]];
    int needA = in.tick - m_maxWindow - 1;

    if (m_cp && m_cpApplied <= needA && needA - m_cpApplied <= kReuseGap) {
        beginInput();
        return;
    }

    if (s.feeder.lastApplied >= needA) {
        if (s.feeder.lastApplied >= in.tick) {
            // Too close to where the run (re)started to rewind before it.
            m_res = {};
            m_res.input = m_targets[m_cur];
            m_res.tick = in.tick;
            m_res.button = in.button;
            m_res.down = in.down;
            m_res.p1 = in.p1;
            m_res.status = FPStatus::Unknown;
            s.analysis.results.push_back(m_res);
            m_cur++;
            return;
        }
        if (!makeCheckpoint(pl)) {
            finish(pl, false, "Couldn't create a practice checkpoint.");
            return;
        }
        beginInput();
        return;
    }

    step(pl);

    if (s.died) {
        // The plain macro died: practice checkpoints didn't restore the run
        // exactly. Retry this stretch once from the very start of the level.
        if (m_rescueFor != static_cast<int>(m_cur)) {
            m_rescueFor = static_cast<int>(m_cur);
            restartFromStart(pl);
            return;
        }
        finish(pl, false, fmt::format(
            "The macro dies on its own around input {} of {}.\n"
            "It isn't reproducible (was it recorded with Click Between Frames, "
            "a TPS/physics bypass or across practice checkpoints?).",
            m_cur + 1, m_targets.size()));
        return;
    }
    if (s.levelEnded || pl->m_levelEndAnimationStarted) {
        // Inputs after the end of the level don't matter.
        finish(pl, true, "");
    }
}

// ---------------------------------------------------------------------------
// Probing one input

void Analyzer::beginInput() {
    auto& s = Session::get();
    int idx = m_targets[m_cur];
    auto const& in = s.macro.inputs[idx];
    m_res = {};
    m_res.input = idx;
    m_res.tick = in.tick;
    m_res.button = in.button;
    m_res.down = in.down;
    m_res.p1 = in.p1;
    m_early = m_late = 0;
    m_earlyDone = m_lateDone = m_baselineDone = m_unknown = false;
    m_probeActive = false;
    m_phase = Phase::Probing;
}

std::optional<int> Analyzer::nextProbe() {
    if (!m_baselineDone) return 0;
    if (m_unknown) return std::nullopt;

    int idx = m_targets[m_cur];
    auto const& inputs = Session::get().macro.inputs;
    int tick = inputs[idx].tick;
    int pair = m_pair[idx];

    while (true) {
        if (m_early + m_late + 1 > m_maxWindow) return std::nullopt;
        if (m_earlyDone && m_lateDone) return std::nullopt;

        bool early = !m_earlyDone && (m_lateDone || m_early <= m_late);
        if (early) {
            int shifted = tick - (m_early + 1);
            if (shifted <= m_cpApplied || shifted <= m_prevSame[idx]) {
                m_earlyDone = true;
                m_res.limited = true;
                continue;
            }
            return -(m_early + 1);
        }
        else {
            int k = m_late + 1;
            // A press moves together with its release (same hold length),
            // so the limit is the next press after that release.
            int limitIdx = pair >= 0 ? pair : idx;
            int shifted = inputs[limitIdx].tick + k;
            if (shifted >= m_nextSame[limitIdx]) {
                m_lateDone = true;
                m_res.limited = true;
                continue;
            }
            return k;
        }
    }
}

void Analyzer::startProbe(PlayLayer* pl, int d) {
    auto& s = Session::get();
    if (!restoreCheckpoint(pl)) {
        finish(pl, false, "Couldn't rewind to the practice checkpoint.");
        return;
    }

    int idx = m_targets[m_cur];
    auto const& inputs = s.macro.inputs;
    int tick = inputs[idx].tick;

    if (d != 0) {
        s.feeder.moved.push_back({idx, tick + d});
        if (m_pair[idx] >= 0) s.feeder.moved.push_back({m_pair[idx], inputs[m_pair[idx]].tick + d});
    }
    else {
        s.feeder.captureIdx = idx;
        m_baseline.clear();
        m_baseFrom = m_cpApplied + 1;
    }

    m_probeD = d;
    m_convergeFrom = std::max(tick, tick + d);
    m_probeEnd = d == 0 ? tick + m_maxWindow + m_horizon : m_convergeFrom + m_horizon;
    m_probeActive = true;
}

void Analyzer::probeTick(PlayLayer* pl) {
    auto& s = Session::get();

    if (!m_probeActive) {
        auto d = nextProbe();
        if (d) startProbe(pl, *d);
        else finishInput(pl);
        return;
    }

    if (!step(pl)) return;
    int t = s.feeder.lastApplied;

    if (s.died) return probeDone(false);
    if (s.levelEnded || pl->m_levelEndAnimationStarted) return probeDone(true);
    if (t >= m_probeEnd) return probeDone(true);

    if (m_probeD == 0) {
        int i = t - m_baseFrom;
        if (i >= 0) {
            if (static_cast<int>(m_baseline.size()) <= i) m_baseline.resize(i + 1);
            m_baseline[i] = snapshot(pl);
        }
    }
    else if (m_fastConverge && t > m_convergeFrom) {
        // Same player state as the unshifted run on the same tick, with the
        // same inputs from here on: the rest of the run is identical.
        int i = t - m_baseFrom;
        if (i >= 0 && i < static_cast<int>(m_baseline.size()) && m_baseline[i] == snapshot(pl)) {
            return probeDone(true);
        }
    }
}

void Analyzer::probeDone(bool pass) {
    auto& s = Session::get();
    m_probeActive = false;

    if (m_probeD == 0) {
        if (s.feeder.hasCaptured) {
            m_res.x = s.feeder.captured.x;
            m_res.y = s.feeder.captured.y;
        }
        if (pass) {
            m_baselineDone = true;
        }
        else {
            // The unmodified macro died after rewinding: can't judge this one.
            m_baselineDone = true;
            m_unknown = true;
        }
        return;
    }

    if (m_probeD < 0) {
        if (pass) m_early = -m_probeD;
        else m_earlyDone = true;
    }
    else {
        if (pass) m_late = m_probeD;
        else m_lateDone = true;
    }
}

void Analyzer::finishInput(PlayLayer* pl) {
    auto& s = Session::get();

    if (m_unknown) {
        m_res.status = FPStatus::Unknown;
    }
    else {
        m_res.early = m_early;
        m_res.late = m_late;
        m_res.status = m_res.window() <= m_maxWindow ? FPStatus::FP : FPStatus::NotFP;
    }
    s.analysis.results.push_back(m_res);
    m_cur++;

    if (!restoreCheckpoint(pl)) {
        finish(pl, false, "Couldn't rewind to the practice checkpoint.");
        return;
    }
    m_phase = Phase::Main;
}

// ---------------------------------------------------------------------------
// End

void Analyzer::finish(PlayLayer* pl, bool ok, std::string const& message) {
    auto& s = Session::get();
    m_phase = Phase::Off;
    m_cp.swap(nullptr);
    s.mode = Mode::Idle;
    s.feeder.reset(nullptr);
    s.analysis.complete = ok;
    s.hasAnalysis = true;
    s.saveAnalysis();
    setAudioMuted(false);

    int fps = 0, unknown = 0;
    for (auto const& r : s.analysis.results) {
        if (r.status == FPStatus::FP) fps++;
        if (r.status == FPStatus::Unknown) unknown++;
    }
    auto secs = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::steady_clock::now() - m_startTime).count();

    std::string text = ok
        ? fmt::format("Found <cg>{}</c> frame perfect input(s) in {}s.", fps, secs)
        : fmt::format("<cr>Analysis stopped early.</c>\n{}\n\nKept {} result(s) ({} FP).",
            message, s.analysis.results.size(), fps);
    if (unknown > 0) text += fmt::format("\n<cy>{}</c> input(s) couldn't be checked (grey ?).", unknown);

    bool wasPractice = m_wasPractice;
    // Leave the update loop before touching the level.
    queueInMainThread([wasPractice, text] {
        auto pl = PlayLayer::get();
        if (!pl) return;
        pl->removeAllCheckpoints();
        if (!wasPractice && pl->m_isPracticeMode) pl->togglePracticeMode(false);
        pl->resetLevelFromStart();
        overlay::rebuildMarkers(pl);
        pl->pauseGame(false);
        FLAlertLayer::create("FP Counter", text, "OK")->show();
    });
}

void Analyzer::abort(PlayLayer* pl, bool resetLevel) {
    if (m_phase == Phase::Off) return;
    auto& s = Session::get();
    m_phase = Phase::Off;
    m_cp.swap(nullptr);
    s.mode = Mode::Idle;
    s.feeder.reset(nullptr);
    s.analysis.complete = false;
    s.hasAnalysis = !s.analysis.results.empty();
    if (s.hasAnalysis) s.saveAnalysis();
    setAudioMuted(false);

    if (resetLevel && pl) {
        pl->removeAllCheckpoints();
        if (!m_wasPractice && pl->m_isPracticeMode) pl->togglePracticeMode(false);
        pl->resetLevelFromStart();
        overlay::rebuildMarkers(pl);
    }
}

std::string Analyzer::statusText() const {
    if (m_phase == Phase::Off) return "";
    if (m_phase == Phase::Starting) return "Analyzing: starting...";
    float pct = m_targets.empty() ? 0.f : 100.f * m_cur / m_targets.size();
    int fps = 0;
    for (auto const& r : Session::get().analysis.results) {
        if (r.status == FPStatus::FP) fps++;
    }
    return fmt::format("Analyzing {:.0f}%  ({}/{})  FP so far: {}", pct, m_cur, m_targets.size(), fps);
}

}
