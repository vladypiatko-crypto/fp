#pragma once

#include <Geode/Geode.hpp>

namespace fp {

// Opened from the pause menu: record / analyze / replay / stop.
class FPPopup : public geode::Popup {
protected:
    cocos2d::CCLabelBMFont* m_info = nullptr;
    CCMenuItemSpriteExtra* m_markersBtn = nullptr;

    bool init();
    void refresh();
    void resumeGame();

    void onRecord();
    void onAnalyze();
    void onWatch();
    void onStop();
    void onToggleMarkers();

public:
    static FPPopup* create();
};

}
