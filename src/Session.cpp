#include "Session.hpp"

#include <algorithm>
#include <cctype>
#include <map>
#include <sstream>

#include "Analyzer.hpp"
#include "Overlay.hpp"

using namespace geode::prelude;

namespace fp {

std::string fpsLabel(int window) {
    if (window < 1) window = 1;
    if (kTps % window == 0) return std::to_string(kTps / window);
    return fmt::format("{:.1f}", static_cast<double>(kTps) / window);
}

// ---------------------------------------------------------------------------
// Held-button helpers

std::vector<Input> heldAfter(std::vector<Input> const& inputs, int tick) {
    std::map<std::pair<int, bool>, bool> state;
    for (auto const& in : inputs) {
        if (in.tick > tick) break;
        state[{in.button, in.p1}] = in.down;
    }
    std::vector<Input> held;
    for (auto const& [key, down] : state) {
        if (down) held.push_back({0, key.first, true, key.second});
    }
    return held;
}

std::vector<Input> syncTo(Macro const& macro, std::vector<Input> const& held) {
    std::vector<Input> out;
    std::vector<bool> players = macro.twoPlayer ? std::vector<bool>{true, false} : std::vector<bool>{true};
    std::vector<int> buttons = macro.platformer ? std::vector<int>{1, 2, 3} : std::vector<int>{1};
    for (bool p1 : players) {
        for (int b : buttons) out.push_back({0, b, false, p1});
    }
    for (auto const& h : held) out.push_back({0, h.button, true, h.p1});
    return out;
}

// ---------------------------------------------------------------------------
// Feeder

void Feeder::reset(std::vector<Input> const* in) {
    inputs = in;
    lastApplied = -1;
    moved.clear();
    captureIdx = -1;
    hasCaptured = false;
    syncInputs.clear();
}

bool Feeder::isMoved(int idx) const {
    for (auto const& m : moved) {
        if (m.idx == idx) return true;
    }
    return false;
}

void Feeder::apply(GJBaseGameLayer* gl, int idx) {
    auto const& in = (*inputs)[idx];
    if (idx == captureIdx) {
        auto player = (in.p1 || !gl->m_player2) ? gl->m_player1 : gl->m_player2;
        if (player) {
            captured = player->getPosition();
            hasCaptured = true;
        }
    }
    gl->handleButton(in.down, in.button, in.p1);
}

void Feeder::feed(GJBaseGameLayer* gl, int tick) {
    auto& s = Session::get();
    s.injecting = true;

    if (!syncInputs.empty()) {
        for (auto const& in : syncInputs) gl->handleButton(in.down, in.button, in.p1);
        syncInputs.clear();
    }

    if (inputs && tick > lastApplied) {
        auto const& v = *inputs;
        auto it = std::upper_bound(v.begin(), v.end(), lastApplied,
            [](int t, Input const& in) { return t < in.tick; });
        for (; it != v.end() && it->tick <= tick; ++it) {
            int idx = static_cast<int>(it - v.begin());
            if (!isMoved(idx)) apply(gl, idx);
        }
        for (auto const& m : moved) {
            if (m.tick > lastApplied && m.tick <= tick) apply(gl, m.idx);
        }
        lastApplied = tick;
    }

    s.injecting = false;
}

// ---------------------------------------------------------------------------
// Storage: plain text files in the mod's save folder, one pair per level.

namespace {

std::filesystem::path dataDir() {
    auto dir = Mod::get()->getSaveDir() / "levels";
    (void)geode::utils::file::createDirectoryAll(dir);
    return dir;
}

std::string levelKey(GJGameLevel* level) {
    if (!level) return "unknown";
    int id = level->m_levelID.value();
    if (id > 0) return fmt::format("id_{}", id);
    std::string name = level->m_levelName;
    std::string clean;
    for (char c : name) {
        clean += std::isalnum(static_cast<unsigned char>(c)) ? c : '_';
    }
    if (clean.empty()) clean = "unnamed";
    return "local_" + clean;
}

std::filesystem::path macroPath(std::string const& key) { return dataDir() / (key + ".fpmacro"); }
std::filesystem::path analysisPath(std::string const& key) { return dataDir() / (key + ".fpresult"); }

bool loadMacro(std::string const& key, Macro& out) {
    auto res = geode::utils::file::readString(macroPath(key));
    if (!res) return false;
    std::istringstream ss(res.unwrap());
    std::string tag;
    int version = 0;
    if (!(ss >> tag >> version) || tag != "fpmacro") return false;
    Macro m;
    int platformer = 0, twoPlayer = 0, count = 0;
    ss >> tag >> platformer >> tag >> twoPlayer >> tag >> count;
    m.platformer = platformer != 0;
    m.twoPlayer = twoPlayer != 0;
    m.inputs.reserve(std::max(0, count));
    Input in;
    int down = 0, p1 = 0;
    while (ss >> in.tick >> in.button >> down >> p1) {
        in.down = down != 0;
        in.p1 = p1 != 0;
        m.inputs.push_back(in);
    }
    std::stable_sort(m.inputs.begin(), m.inputs.end(),
        [](Input const& a, Input const& b) { return a.tick < b.tick; });
    out = std::move(m);
    return !out.inputs.empty();
}

bool loadAnalysis(std::string const& key, Analysis& out) {
    auto res = geode::utils::file::readString(analysisPath(key));
    if (!res) return false;
    std::istringstream ss(res.unwrap());
    std::string tag;
    int version = 0;
    if (!(ss >> tag >> version) || tag != "fpresult") return false;
    Analysis a;
    int complete = 0, count = 0;
    ss >> tag >> a.maxWindow >> tag >> a.horizon >> tag >> complete >> tag >> count;
    a.complete = complete != 0;
    FPResult r;
    int down = 0, p1 = 0, limited = 0, status = 0;
    while (ss >> r.input >> r.tick >> r.x >> r.y >> r.button >> down >> p1
              >> r.early >> r.late >> limited >> status) {
        r.down = down != 0;
        r.p1 = p1 != 0;
        r.limited = limited != 0;
        r.status = static_cast<FPStatus>(std::clamp(status, 0, 2));
        a.results.push_back(r);
    }
    out = std::move(a);
    return true;
}

}

Session& Session::get() {
    static Session s;
    return s;
}

bool Session::saveMacro() {
    std::ostringstream ss;
    ss << "fpmacro 1\n";
    ss << "platformer " << (macro.platformer ? 1 : 0) << "\n";
    ss << "twoPlayer " << (macro.twoPlayer ? 1 : 0) << "\n";
    ss << "inputs " << macro.inputs.size() << "\n";
    for (auto const& in : macro.inputs) {
        ss << in.tick << ' ' << in.button << ' ' << (in.down ? 1 : 0) << ' ' << (in.p1 ? 1 : 0) << '\n';
    }
    auto res = geode::utils::file::writeString(macroPath(levelKey), ss.str());
    if (!res) log::error("Failed to save macro: {}", res.unwrapErr());
    return res.isOk();
}

bool Session::saveAnalysis() {
    std::ostringstream ss;
    ss << "fpresult 1\n";
    ss << "maxWindow " << analysis.maxWindow << "\n";
    ss << "horizon " << analysis.horizon << "\n";
    ss << "complete " << (analysis.complete ? 1 : 0) << "\n";
    ss << "results " << analysis.results.size() << "\n";
    for (auto const& r : analysis.results) {
        ss << r.input << ' ' << r.tick << ' ' << r.x << ' ' << r.y << ' ' << r.button << ' '
           << (r.down ? 1 : 0) << ' ' << (r.p1 ? 1 : 0) << ' ' << r.early << ' ' << r.late << ' '
           << (r.limited ? 1 : 0) << ' ' << static_cast<int>(r.status) << '\n';
    }
    auto res = geode::utils::file::writeString(analysisPath(levelKey), ss.str());
    if (!res) log::error("Failed to save analysis: {}", res.unwrapErr());
    return res.isOk();
}

void Session::deleteAnalysis() {
    std::error_code ec;
    std::filesystem::remove(analysisPath(levelKey), ec);
}

// ---------------------------------------------------------------------------
// Level lifecycle

void Session::enterLevel(PlayLayer* pl) {
    mode = Mode::Idle;
    levelKey = fp::levelKey(pl->m_level);
    feeder.reset(nullptr);
    checkpointTicks.clear();
    injecting = false;
    inStep = false;
    lastEntry = -1;
    rec = {};

    macro = {};
    hasMacro = loadMacro(levelKey, macro);
    analysis = {};
    hasAnalysis = hasMacro && loadAnalysis(levelKey, analysis);
}

void Session::quitLevel(PlayLayer* pl) {
    if (mode == Mode::Analyzing) Analyzer::get().abort(pl, false);
    mode = Mode::Idle;
    feeder.reset(nullptr);
    checkpointTicks.clear();
}

void Session::afterReset(PlayLayer* pl) {
    int progress = static_cast<int>(pl->m_gameState.m_currentProgress);

    // Did we respawn at a practice checkpoint? Find which one and the last
    // input tick it contains.
    std::optional<int> cpTick;
    if (progress > 0 && pl->m_isPracticeMode && pl->m_checkpointArray) {
        auto arr = pl->m_checkpointArray;
        for (int i = static_cast<int>(arr->count()) - 1; i >= 0; --i) {
            auto cp = static_cast<CheckpointObject*>(arr->objectAtIndex(i));
            if (static_cast<int>(cp->m_gameState.m_currentProgress) != progress) continue;
            auto it = checkpointTicks.find(cp);
            cpTick = it != checkpointTicks.end() ? it->second : progress - 1;
            break;
        }
    }

    switch (mode) {
        case Mode::Recording: {
            feeder.syncInputs.clear();
            if (cpTick) {
                auto& v = rec.inputs;
                v.erase(std::remove_if(v.begin(), v.end(),
                    [&](Input const& in) { return in.tick > *cpTick; }), v.end());
                // Respawning drops held buttons: release them in the macro and
                // in the game so playback sees exactly what happened here.
                for (auto in : heldAfter(v, *cpTick)) {
                    in.tick = *cpTick + 1;
                    in.down = false;
                    v.push_back(in);
                    feeder.syncInputs.push_back(in);
                }
                lastEntry = *cpTick;
            }
            else {
                rec.inputs.clear();
                lastEntry = -1;
            }
            break;
        }
        case Mode::Playing: {
            feeder.reset(&macro.inputs);
            if (cpTick) {
                feeder.lastApplied = *cpTick;
                feeder.syncInputs = syncTo(macro, heldAfter(macro.inputs, *cpTick));
            }
            break;
        }
        default: break;
    }
}

// ---------------------------------------------------------------------------
// Modes

void Session::startRecording(PlayLayer* pl) {
    if (mode == Mode::Analyzing) Analyzer::get().abort(pl, false);
    mode = Mode::Recording;
    rec = {};
    rec.platformer = pl->m_levelSettings->m_platformerMode;
    rec.twoPlayer = pl->m_levelSettings->m_twoPlayerMode;
    feeder.reset(nullptr);
    checkpointTicks.clear();
    pl->removeAllCheckpoints();
    pl->resetLevelFromStart();
}

void Session::finishRecording(PlayLayer* pl) {
    mode = Mode::Idle;
    feeder.reset(nullptr);
    if (rec.inputs.empty()) {
        Notification::create("FP Counter: no inputs were recorded", NotificationIcon::Warning)->show();
        return;
    }
    std::stable_sort(rec.inputs.begin(), rec.inputs.end(),
        [](Input const& a, Input const& b) { return a.tick < b.tick; });
    macro = std::move(rec);
    rec = {};
    hasMacro = true;
    saveMacro();

    analysis = {};
    hasAnalysis = false;
    deleteAnalysis();
    overlay::rebuildMarkers(pl);

    Notification::create(
        fmt::format("Macro saved ({} inputs). Pause > FP > Analyze", macro.inputs.size()),
        NotificationIcon::Success, 4.f
    )->show();
}

void Session::startPlayback(PlayLayer* pl) {
    if (mode == Mode::Analyzing) Analyzer::get().abort(pl, false);
    mode = Mode::Playing;
    feeder.reset(&macro.inputs);
    pl->removeAllCheckpoints();
    pl->resetLevelFromStart();
}

void Session::stop(PlayLayer* pl) {
    if (mode == Mode::Analyzing) {
        Analyzer::get().abort(pl, true);
        return;
    }
    mode = Mode::Idle;
    feeder.reset(nullptr);
    rec = {};
}

void Session::recordInput(GJBaseGameLayer* gl, bool down, int button, bool isP1) {
    if (gl->m_player1 && gl->m_player1->m_isDead) return;
    Input in;
    in.tick = inStep ? stepTick : lastEntry + 1;
    in.button = button;
    in.down = down;
    in.p1 = gl->m_levelSettings->m_twoPlayerMode ? isP1 : true;
    rec.inputs.push_back(in);
}

}
