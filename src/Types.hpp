#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace fp {

// Geometry Dash 2.2 runs physics at a fixed 240 steps per second.
inline constexpr int kTps = 240;

// One button event, applied at the start of physics step `tick`
// (GJGameState::m_currentProgress at GJBaseGameLayer::processCommands entry).
struct Input {
    int tick = 0;
    int button = 1;     // 1 = jump, 2 = left, 3 = right
    bool down = true;
    bool p1 = true;     // third argument of GJBaseGameLayer::handleButton
};

struct Macro {
    std::vector<Input> inputs;
    bool platformer = false;
    bool twoPlayer = false;
};

enum class FPStatus : uint8_t {
    NotFP = 0,   // window wider than the "lowest FPS to mark" setting
    FP = 1,
    Unknown = 2, // the analyzer couldn't reproduce this part of the run
};

struct FPResult {
    int input = 0;      // index into Macro::inputs
    int tick = 0;
    float x = 0.f;
    float y = 0.f;
    int button = 1;
    bool down = true;
    bool p1 = true;
    int early = 0;      // ticks the input could move earlier and still survive
    int late = 0;       // ticks it could move later
    bool limited = false; // a neighbouring input stopped the search on one side
    FPStatus status = FPStatus::Unknown;

    int window() const { return early + late + 1; }
};

struct Analysis {
    std::vector<FPResult> results;
    int maxWindow = 4;
    int horizon = 120;
    bool complete = false;
};

// 240 / window, e.g. 1 -> "240", 3 -> "80", 7 -> "34.3"
std::string fpsLabel(int window);

}
