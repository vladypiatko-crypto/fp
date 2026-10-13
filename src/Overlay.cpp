#include "Overlay.hpp"

#include <map>

#include "Session.hpp"

using namespace geode::prelude;

namespace fp::overlay {

namespace {

ccColor3B tierColor(FPResult const& r) {
    if (r.status == FPStatus::Unknown) return {150, 150, 150};
    switch (r.window()) {
        case 1: return {255, 40, 70};    // 240 fps
        case 2: return {255, 140, 30};   // 120 fps
        case 3: return {255, 230, 50};   // 80 fps
        case 4: return {80, 255, 80};    // 60 fps
        default: return {70, 200, 255};  // slower than 60 fps
    }
}

ccColor4F toColor4F(ccColor3B c, float a) {
    return {c.r / 255.f, c.g / 255.f, c.b / 255.f, a};
}

}

void rebuildMarkers(PlayLayer* pl) {
    if (!pl || !pl->m_objectLayer) return;
    if (auto old = pl->m_objectLayer->getChildByID("markers"_spr)) old->removeFromParent();

    auto& s = Session::get();
    if (s.hasAnalysis && Mod::get()->getSettingValue<bool>("show-markers")) {
        float scale = static_cast<float>(Mod::get()->getSettingValue<double>("marker-scale"));
        auto root = CCNode::create();
        root->setID("markers"_spr);
        auto draw = CCDrawNode::create();
        root->addChild(draw);

        for (auto const& r : s.analysis.results) {
            if (r.status == FPStatus::NotFP) continue;
            auto color = tierColor(r);
            CCPoint pos{r.x, r.y};
            float radius = (r.down ? 15.f : 10.f) * scale;
            draw->drawCircle(pos, radius, toColor4F(color, 0.18f), 1.6f * scale, toColor4F(color, 1.f), 32);

            std::string text = r.status == FPStatus::Unknown ? "?" : fpsLabel(r.window());
            if (r.status == FPStatus::FP && r.limited) text += "*";
            if (!r.down) text += " rel";
            auto label = CCLabelBMFont::create(text.c_str(), "bigFont.fnt");
            label->setScale(0.38f * scale);
            label->setColor(color);
            label->setPosition(pos + CCPoint{0.f, radius + 8.f * scale});
            root->addChild(label);
        }
        pl->m_objectLayer->addChild(root, 9999);
    }
    updateHud(pl);
}

void updateHud(PlayLayer* pl, std::string const& status) {
    if (!pl || !pl->m_uiLayer) return;
    auto& s = Session::get();

    auto label = static_cast<CCLabelBMFont*>(pl->m_uiLayer->getChildByID("hud"_spr));
    bool show = Mod::get()->getSettingValue<bool>("show-hud") || !status.empty();

    std::string text = status;
    if (text.empty() && s.mode == Mode::Recording) text = "FP Counter: recording";
    if (text.empty() && s.mode == Mode::Playing) text = "FP Counter: replaying macro";
    if (text.empty() && s.hasAnalysis) {
        std::map<int, int> counts;
        int unknown = 0;
        for (auto const& r : s.analysis.results) {
            if (r.status == FPStatus::FP) counts[r.window()]++;
            else if (r.status == FPStatus::Unknown) unknown++;
        }
        text = "FP:";
        if (counts.empty()) text += " none";
        for (auto const& [window, count] : counts) {
            text += fmt::format("  {}fps x{}", fpsLabel(window), count);
        }
        if (unknown) text += fmt::format("  ? x{}", unknown);
        if (!s.analysis.complete) text += "  (partial)";
    }

    if (!show || text.empty()) {
        if (label) label->setVisible(false);
        return;
    }
    if (!label) {
        label = CCLabelBMFont::create("", "bigFont.fnt");
        label->setID("hud"_spr);
        label->setAnchorPoint({0.f, 1.f});
        label->setScale(0.32f);
        label->setOpacity(220);
        auto win = CCDirector::sharedDirector()->getWinSize();
        label->setPosition({6.f, win.height - 6.f});
        pl->m_uiLayer->addChild(label, 1000);
    }
    label->setVisible(true);
    label->setString(text.c_str());
}

}
