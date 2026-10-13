#include <Geode/Geode.hpp>
#include <Geode/modify/GJBaseGameLayer.hpp>
#include <Geode/modify/GameStatsManager.hpp>
#include <Geode/modify/PlayLayer.hpp>

#include "../Analyzer.hpp"
#include "../Overlay.hpp"
#include "../Session.hpp"

using namespace geode::prelude;
using namespace fp;

class $modify(FPBaseGameLayer, GJBaseGameLayer) {
    // While analysing, replace the normal frame update with as many single
    // physics steps as fit in the frame budget.
    void update(float dt) {
        auto pl = PlayLayer::get();
        if (!pl || static_cast<GJBaseGameLayer*>(pl) != this || Session::get().mode != Mode::Analyzing) {
            return GJBaseGameLayer::update(dt);
        }
        Analyzer::get().drive(pl);
    }

    // Called once per physics step: the place to apply macro inputs.
    void processCommands(float dt, bool isHalfTick, bool isLastTick) {
        auto& s = Session::get();
        auto pl = PlayLayer::get();
        if (!pl || static_cast<GJBaseGameLayer*>(pl) != this) {
            return GJBaseGameLayer::processCommands(dt, isHalfTick, isLastTick);
        }

        int tick = static_cast<int>(m_gameState.m_currentProgress);
        s.inStep = true;
        s.stepTick = tick;
        if (s.mode == Mode::Playing || s.mode == Mode::Analyzing || !s.feeder.syncInputs.empty()) {
            s.feeder.feed(this, tick);
        }

        GJBaseGameLayer::processCommands(dt, isHalfTick, isLastTick);

        s.inStep = false;
        s.lastEntry = tick;
        s.stepsRun++;
    }

    void handleButton(bool down, int button, bool isPlayer1) {
        auto& s = Session::get();
        auto pl = PlayLayer::get();
        if (!pl || static_cast<GJBaseGameLayer*>(pl) != this || s.injecting || s.mode == Mode::Idle) {
            return GJBaseGameLayer::handleButton(down, button, isPlayer1);
        }
        // The macro is in control: ignore real clicks.
        if (s.mode == Mode::Playing || s.mode == Mode::Analyzing) return;

        GJBaseGameLayer::handleButton(down, button, isPlayer1);
        if (s.mode == Mode::Recording) s.recordInput(this, down, button, isPlayer1);
    }
};

class $modify(FPPlayLayer, PlayLayer) {
    bool init(GJGameLevel* level, bool useReplay, bool dontCreateObjects) {
        if (!PlayLayer::init(level, useReplay, dontCreateObjects)) return false;
        Session::get().enterLevel(this);
        overlay::rebuildMarkers(this);
        return true;
    }

    void onQuit() {
        Session::get().quitLevel(this);
        PlayLayer::onQuit();
    }

    void resetLevel() {
        auto& s = Session::get();
        s.died = false;
        PlayLayer::resetLevel();
        s.afterReset(this);
        // The analyser rewinds many times per frame and draws its own status.
        if (s.mode != Mode::Analyzing) overlay::updateHud(this);
    }

    void destroyPlayer(PlayerObject* player, GameObject* object) {
        auto& s = Session::get();
        // During analysis a death only fails the current probe; the analyser
        // rewinds itself, so the normal death/respawn must not happen.
        if (s.mode == Mode::Analyzing && object != m_anticheatSpike) {
            s.died = true;
            return;
        }
        PlayLayer::destroyPlayer(player, object);
    }

    void levelComplete() {
        auto& s = Session::get();
        if (s.mode == Mode::Analyzing) {
            s.levelEnded = true;
            return;
        }
        if (s.mode == Mode::Recording) s.finishRecording(this);
        else if (s.mode == Mode::Playing) s.mode = Mode::Idle;
        PlayLayer::levelComplete();
    }

    void storeCheckpoint(CheckpointObject* checkpoint) {
        auto& s = Session::get();
        // Only the analyser's own checkpoints while it runs (no auto-checkpoints).
        if (s.mode == Mode::Analyzing && !s.allowCheckpointStore) return;
        PlayLayer::storeCheckpoint(checkpoint);
        s.checkpointTicks[checkpoint] = s.inStep ? s.stepTick : s.lastEntry;
    }

    void processCheckpoints() {
        if (Session::get().mode == Mode::Analyzing) return;
        PlayLayer::processCheckpoints();
    }
};

// Thousands of rewound attempts shouldn't inflate the player's stats.
class $modify(FPStatsManager, GameStatsManager) {
    void incrementStat(char const* key, int amount) {
        if (Session::get().mode == Mode::Analyzing) return;
        GameStatsManager::incrementStat(key, amount);
    }
};
