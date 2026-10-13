#pragma once

#include <Geode/Geode.hpp>
#include <unordered_map>
#include "Types.hpp"

namespace fp {

enum class Mode { Idle, Recording, Playing, Analyzing };

// Applies macro inputs at the start of each physics step. During analysis it
// can move inputs to other ticks (the "probe" being tested).
struct Feeder {
    struct Moved {
        int idx;
        int tick;
    };

    std::vector<Input> const* inputs = nullptr;
    int lastApplied = -1;           // last tick whose inputs were applied
    std::vector<Moved> moved;       // inputs played at a different tick
    int captureIdx = -1;            // remember player position when this input fires
    cocos2d::CCPoint captured;
    bool hasCaptured = false;
    std::vector<Input> syncInputs;  // applied before anything else on the next step

    void reset(std::vector<Input> const* in);
    void feed(GJBaseGameLayer* gl, int tick);

private:
    bool isMoved(int idx) const;
    void apply(GJBaseGameLayer* gl, int idx);
};

struct Session {
    Mode mode = Mode::Idle;
    std::string levelKey;

    Macro macro;            // the saved macro for this level
    bool hasMacro = false;
    Macro rec;              // macro being recorded right now
    Analysis analysis;
    bool hasAnalysis = false;

    Feeder feeder;
    bool injecting = false;     // true while we call handleButton ourselves
    bool inStep = false;        // inside processCommands
    int stepTick = 0;           // tick of the step being processed
    int lastEntry = -1;         // tick of the last finished step
    uint64_t stepsRun = 0;

    // analysis flags, set by hooks
    bool died = false;
    bool levelEnded = false;
    bool allowCheckpointStore = false;

    // practice checkpoints placed while recording -> last tick they contain
    std::unordered_map<CheckpointObject*, int> checkpointTicks;

    static Session& get();

    void enterLevel(PlayLayer* pl);
    void quitLevel(PlayLayer* pl);
    void afterReset(PlayLayer* pl);

    void startRecording(PlayLayer* pl);
    void finishRecording(PlayLayer* pl);
    void startPlayback(PlayLayer* pl);
    void stop(PlayLayer* pl);

    void recordInput(GJBaseGameLayer* gl, bool down, int button, bool isP1);

    bool saveMacro();
    bool saveAnalysis();
    void deleteAnalysis();
};

// Buttons held after every input with tick <= `tick` has been applied.
std::vector<Input> heldAfter(std::vector<Input> const& inputs, int tick);

// Inputs that force the game's held buttons to exactly `held`.
std::vector<Input> syncTo(Macro const& macro, std::vector<Input> const& held);

}
