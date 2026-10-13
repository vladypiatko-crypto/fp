#include "FPPopup.hpp"

#include <map>

#include "../Analyzer.hpp"
#include "../Overlay.hpp"
#include "../Session.hpp"

using namespace geode::prelude;

namespace fp {

FPPopup* FPPopup::create() {
    auto ret = new FPPopup();
    if (ret->init()) {
        ret->autorelease();
        return ret;
    }
    delete ret;
    return nullptr;
}

bool FPPopup::init() {
    if (!Popup::init(320.f, 230.f)) return false;
    this->setTitle("FP Counter");

    auto size = m_mainLayer->getContentSize();

    m_info = CCLabelBMFont::create("", "chatFont.fnt");
    m_info->setAlignment(kCCTextAlignmentCenter);
    m_info->setScale(0.75f);
    m_info->setPosition({size.width / 2.f, size.height - 72.f});
    m_mainLayer->addChild(m_info);

    auto menu = CCMenu::create();
    menu->setPosition({0.f, 0.f});
    m_mainLayer->addChild(menu);

    auto addButton = [&](char const* text, CCPoint pos, auto callback) {
        auto spr = ButtonSprite::create(text);
        spr->setScale(0.75f);
        auto btn = CCMenuItemExt::createSpriteExtra(spr, [this, callback](CCMenuItemSpriteExtra*) {
            (this->*callback)();
        });
        btn->setPosition(pos);
        menu->addChild(btn);
        return btn;
    };

    float y1 = 72.f, y2 = 32.f;
    addButton("Record", {size.width * 0.2f, y1}, &FPPopup::onRecord);
    addButton("Analyze", {size.width * 0.5f, y1}, &FPPopup::onAnalyze);
    addButton("Watch", {size.width * 0.8f, y1}, &FPPopup::onWatch);
    addButton("Stop", {size.width * 0.3f, y2}, &FPPopup::onStop);
    m_markersBtn = addButton("Markers", {size.width * 0.7f, y2}, &FPPopup::onToggleMarkers);

    refresh();
    return true;
}

void FPPopup::refresh() {
    auto& s = Session::get();

    std::string mode;
    switch (s.mode) {
        case Mode::Idle: mode = "idle"; break;
        case Mode::Recording: mode = "recording"; break;
        case Mode::Playing: mode = "replaying"; break;
        case Mode::Analyzing: mode = Analyzer::get().statusText(); break;
    }

    std::string macro = s.hasMacro
        ? fmt::format("Macro: {} inputs", s.macro.inputs.size())
        : std::string("Macro: none (tap Record, then beat the level)");

    std::string result = "Results: not analysed yet";
    if (s.hasAnalysis) {
        std::map<int, int> counts;
        for (auto const& r : s.analysis.results) {
            if (r.status == FPStatus::FP) counts[r.window()]++;
        }
        result = "Results:";
        if (counts.empty()) result += " no frame perfects";
        for (auto const& [window, count] : counts) {
            result += fmt::format(" {}fps x{}", fpsLabel(window), count);
        }
        if (!s.analysis.complete) result += " (partial)";
    }

    bool markers = Mod::get()->getSettingValue<bool>("show-markers");
    m_info->setString(fmt::format("{}\n{}\nMarkers: {}   Mode: {}",
        macro, result, markers ? "on" : "off", mode).c_str());
}

void FPPopup::resumeGame() {
    this->onClose(nullptr);
    auto scene = CCDirector::sharedDirector()->getRunningScene();
    if (auto pause = scene ? scene->getChildByType<PauseLayer>(0) : nullptr) {
        pause->onResume(nullptr);
    }
}

void FPPopup::onRecord() {
    auto pl = PlayLayer::get();
    if (!pl) return;
    if (Loader::get()->isModLoaded("syzzi.click_between_frames")) {
        Notification::create(
            "Click Between Frames is on: its sub-frame clicks can't be replayed exactly",
            NotificationIcon::Warning, 4.f
        )->show();
    }
    Session::get().startRecording(pl);
    overlay::updateHud(pl);
    resumeGame();
}

void FPPopup::onAnalyze() {
    auto pl = PlayLayer::get();
    if (!pl) return;
    std::string error;
    if (!Analyzer::get().begin(pl, error)) {
        FLAlertLayer::create("FP Counter", error, "OK")->show();
        return;
    }
    resumeGame();
}

void FPPopup::onWatch() {
    auto pl = PlayLayer::get();
    if (!pl) return;
    auto& s = Session::get();
    if (!s.hasMacro) {
        FLAlertLayer::create("FP Counter", "There is no macro for this level yet.", "OK")->show();
        return;
    }
    s.startPlayback(pl);
    overlay::updateHud(pl);
    resumeGame();
}

void FPPopup::onStop() {
    auto pl = PlayLayer::get();
    if (!pl) return;
    Session::get().stop(pl);
    overlay::updateHud(pl);
    refresh();
}

void FPPopup::onToggleMarkers() {
    bool markers = Mod::get()->getSettingValue<bool>("show-markers");
    Mod::get()->setSettingValue<bool>("show-markers", !markers);
    if (auto pl = PlayLayer::get()) overlay::rebuildMarkers(pl);
    refresh();
}

}
