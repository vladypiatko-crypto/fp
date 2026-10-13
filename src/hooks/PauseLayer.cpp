#include <Geode/Geode.hpp>
#include <Geode/modify/PauseLayer.hpp>

#include "../ui/FPPopup.hpp"

using namespace geode::prelude;

class $modify(FPPauseLayer, PauseLayer) {
    void customSetup() {
        PauseLayer::customSetup();

        auto menu = this->getChildByID("right-button-menu");
        if (!menu) return;

        auto spr = ButtonSprite::create("FP");
        spr->setScale(0.7f);
        auto btn = CCMenuItemExt::createSpriteExtra(spr, [](CCMenuItemSpriteExtra*) {
            if (auto popup = fp::FPPopup::create()) popup->show();
        });
        btn->setID("fp-counter-button"_spr);
        menu->addChild(btn);
        menu->updateLayout();
    }
};
