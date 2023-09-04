/* global themePrefix */

import Component from "@glimmer/component";
import Session from "discourse/models/session";
import { action, computed } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import {
  COLOR_SCHEME_OVERRIDE_KEY,
  colorSchemeOverride,
} from "../lib/color-scheme-override";

export default class ColorSchemeToggler extends Component {
  @service keyValueStore;
  @tracked storedOverride;

  constructor() {
    super(...arguments);
    this.storedOverride = this.keyValueStore.getItem(COLOR_SCHEME_OVERRIDE_KEY);
  }

  @computed("storedOverride")
  get toggleButtonIcon() {
    switch (this.OSMode) {
      case "dark":
        return this.storedOverride === "light" ? "moon" : "sun";
      case "light":
        return this.storedOverride === "dark" ? "sun" : "moon";
    }
  }

  get OSMode() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  @action
  toggleScheme() {
    switch (this.OSMode) {
      case "light":
        if (this.keyValueStore.getItem(COLOR_SCHEME_OVERRIDE_KEY) === "dark") {
          this.keyValueStore.removeItem(COLOR_SCHEME_OVERRIDE_KEY);
        } else {
          this.keyValueStore.setItem(COLOR_SCHEME_OVERRIDE_KEY, "dark");
        }
        break;
      case "dark":
        if (this.keyValueStore.getItem(COLOR_SCHEME_OVERRIDE_KEY) !== "light") {
          this.keyValueStore.setItem(COLOR_SCHEME_OVERRIDE_KEY, "light");
        } else {
          this.keyValueStore.removeItem(COLOR_SCHEME_OVERRIDE_KEY);
        }
        break;
    }

    this.storedOverride =
      this.keyValueStore.getItem(COLOR_SCHEME_OVERRIDE_KEY) || null;

    // currently only used to flip category logos back/forth
    Session.currentProp("colorSchemeOverride", this.storedOverride);

    colorSchemeOverride(this.storedOverride);
  }
}

    function createToggle(iconName, labelName) {
      let title = I18n.t(themePrefix("toggle_description"));

      let toggle = h("div.scheme-toggle", { title }, [
        iconNode(iconName, { class: "scheme-icon" }),
        h("span", I18n.t(themePrefix(labelName))),
      ]);

      return h("a.widget-link.dark-light-toggle", [toggle]);
    }

    loadDarkOrLight();

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", updateThemeColor);

    withPluginApi("0.8", (api) => {
      // this will reset the scheme choice to 'auto' whenever a user
      // changes their color scheme preferences in the user interface
      api.modifyClass("controller:preferences/interface", {
        pluginId: "discourse-color-scheme-toggle",

        @observes("selectedColorSchemeId")
        onChangeColorScheme() {
          switchToAuto();
        },

        @observes("selectedDarkColorSchemeId")
        onChangeDarkColorScheme() {
          switchToAuto();
        },
      });

      api.createWidget("dark-light-toggle", {
        tagName: "li.dark-light-toggle.icon",

        buildKey: () => "dark-light-toggle",

        buildId: () => "dark-light-toggle",

        click() {
          toggleDarkLight();
          this.scheduleRerender();
        },

        selectedScheme(scheme) {
          if (activeScheme() === scheme) {
            return ".selected";
          }

          return "";
        },

        html() {
          return h(`label.switch.${activeScheme()}`, [
            h(`span.slider.round`, ""),
            h(
              `span.toggle-icon.round.dark${this.selectedScheme("light")}`,
              iconNode("sun", {
                class: "scheme-icon",
              })
            ),
            h(
              `span.toggle-icon.round.light${this.selectedScheme("dark")}`,
              iconNode("far-moon", {
                class: "scheme-icon",
              })
            ),
          ]);
        },
      });

      if (settings.add_color_scheme_toggle_to_header) {
        api.addToHeaderIcons("dark-light-toggle");
      }

      api.createWidget("dark-light-selector", {
        buildKey: () => "dark-light-selector",

        click() {
          toggleDarkLight();
        },

        html() {
          if (activeScheme() === "light") {
            return createToggle("far-moon", "toggle_dark_mode");
          } else {
            return createToggle("sun", "toggle_light_mode");
          }
        },
      });

      api.createWidget("auto-selector", {
        buildKey: () => "auto-selector",

        defaultState() {
          // checks to see what the autoScheme should be
          // I do this by checking if the users sytem setting is in dark mode
          // if the system setting is in dark mode, then the 'auto' scheme should be dark
          // and light if it is not
          if (window?.matchMedia("(prefers-color-scheme: dark)").matches) {
            return { autoScheme: "dark" };
          } else {
            return { autoScheme: "light" };
          }
        },

        click() {
          // if auto is currently selected, turn auto off
          // and set userSelectedScheme to the original color scheme
          if (cookie("userSelectedScheme") === "auto") {
            if (this.state.autoScheme === "light") {
              switchToLight();
            } else {
              switchToDark();
            }
          } else {
            switchToAuto();
          }
        },

        html() {
          let icon =
            cookie("userSelectedScheme") === "auto"
              ? "check-square"
              : "far-square";

          return h("a.widget-link.auto-toggle", [
            iconNode(icon, {
              class: "scheme-icon",
            }),
            h(
              "p",
              { title: I18n.t(themePrefix("auto_mode_description")) },
              I18n.t(themePrefix("toggle_auto_mode"))
            ),
          ]);
        },
      });

      api.decorateWidget("menu-links:before", (helper) => {
        if (helper.attrs.name === "footer-links") {
          if (!settings.add_color_scheme_toggle_to_header) {
            return [
              h("ul.color-scheme-toggle", [
                h("li", helper.widget.attach("dark-light-selector")),
                h("li", helper.widget.attach("auto-selector")),
              ]),
              h("hr"),
            ];
          }
          return "";
        }
      });
    });
  },
};
