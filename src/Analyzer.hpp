#pragma once

#include <Geode/Geode.hpp>
#include <chrono>
#include <optional>
#include "Types.hpp"

namespace fp {

// Finds the frame window of every input by replaying the macro from practice
// checkpoints with that one input moved earlier/later, one tick at a time,
// and checking whether the player still survives.
class Analyzer {
public:
    static Analyzer& get();

    bool begin(PlayLayer* pl, std::string& error);
    // Runs as many physics steps as fit in the frame budget. Called from the
    // GJBaseGameLayer::update hook instead of the normal update.
    void drive(PlayLayer* pl);
    void abort(PlayLayer* pl, bool resetLevel);

    bool active() const { return m_phase != Phase::Off; }
    std::string statusText() const;

private:
    enum class Phase { Off, Starting, Main, Probing };

    struct PlayerSnap {
        float x = 0.f, y = 0.f;
        double yVel = 0.0, xVel = 0.0;
        float size = 1.f;
        bool upsideDown = false, ship = false, bird = false, ball = false, dart = false;
        bool robot = false, spider = false, swing = false, onGround = false, goingLeft = false;
        bool operator==(PlayerSnap const&) const = default;
    };
    struct Snap {
        PlayerSnap p1, p2;
        bool valid = false;
        bool operator==(Snap const& o) const { return valid && o.valid && p1 == o.p1 && p2 == o.p2; }
    };

    Snap snapshot(PlayLayer* pl) const;
    bool step(PlayLayer* pl);
    void restartFromStart(PlayLayer* pl);
    bool makeCheckpoint(PlayLayer* pl);
    bool restoreCheckpoint(PlayLayer* pl);

    void mainTick(PlayLayer* pl);
    void beginInput();
    void probeTick(PlayLayer* pl);
    std::optional<int> nextProbe();
    void startProbe(PlayLayer* pl, int d);
    void probeDone(bool pass);
    void finishInput(PlayLayer* pl);
    void finish(PlayLayer* pl, bool ok, std::string const& message);

    Phase m_phase = Phase::Off;

    // setup
    std::vector<int> m_targets;     // input indices to analyse
    std::vector<int> m_prevSame;    // tick of previous input on the same button
    std::vector<int> m_nextSame;    // tick of next input on the same button
    std::vector<int> m_pair;        // press -> index of its release (or -1)
    int m_maxWindow = 4;
    int m_horizon = 120;
    bool m_fastConverge = true;
    bool m_wasPractice = false;
    size_t m_cur = 0;
    int m_rescueFor = -1;
    int m_noProgress = 0;
    std::chrono::steady_clock::time_point m_startTime;

    // checkpoint
    geode::Ref<CheckpointObject> m_cp;
    int m_cpApplied = -1;           // last input tick contained in the checkpoint
    int m_cpProgress = 0;
    std::vector<Input> m_cpHeld;
    bool m_atCP = false;

    // search state for the current input
    FPResult m_res;
    int m_early = 0, m_late = 0;
    bool m_earlyDone = false, m_lateDone = false, m_baselineDone = false, m_unknown = false;
    bool m_probeActive = false;
    int m_probeD = 0;
    int m_probeEnd = 0;
    int m_convergeFrom = 0;
    std::vector<Snap> m_baseline;
    int m_baseFrom = 0;
};

void setAudioMuted(bool muted);

}
