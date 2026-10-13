#pragma once

#include <Geode/Geode.hpp>

namespace fp::overlay {

// Circles + labels at every analysed input, placed in the level's object
// layer so they scroll with the level.
void rebuildMarkers(PlayLayer* pl);

// Top-left text: FP counts per tier, or analysis progress.
void updateHud(PlayLayer* pl, std::string const& status = "");

}
