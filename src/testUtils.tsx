import React from "react";
import { render } from "react-testing-library";
import { Provider as MobxProvider } from "mobx-react";

import { createStore, MyMobxStore } from "./stores";
import { appWithTranslationMock } from "./services/i18n/NamespaceMock";
import {
  LanguageManagerProvider,
  LanguageManagerConsumer
} from "./services/i18n/LanguageManager";
import { i18n as i18nInstance } from "../i18n";
import { setDefaultLanguageFromCookie } from "./services/i18n/utils";

/**
 * ⚠️ This is a hack, the other import ways don't work (how does `next-i18next` manages it internally ?... It's the same code ...):
 * Won't work:
 * - import { I18nextProvider } from "react-i18next";
 * - const I18nextProvider = require("react-i18next").I18nextProvider;
 */
const I18nextProvider = require("../node_modules/react-i18next/dist/commonjs/I18nextProvider") // tslint:disable-line
  .I18nextProvider;

export {
  wait,
  waitForElement,
  render,
  cleanup,
  fireEvent
} from "react-testing-library";

type CompType = (props: any) => JSX.Element;

/**
 * If your component is wrapped in `withNamespaces` and uses the `t` prop,
 * we need to mock it - see `src/services/i18n/NamespaceMock`
 *
 * MAKE sure you mocked withNamespaces in the setup of the tests (setupTests.js):
 *
 * ```
 * const { withNamespacesMock } = require("./services/i18n/NamespaceMock");
 *
 * jest.mock("react-i18next", () => ({
 *   withNamespaces: () => Component => Component
 * }));
 * ```
 * @param ui
 * @param renderOptions
 */
export const renderI18nNamespacesWrappedComponent = (
  Comp: React.Component | CompType,
  renderOptions = {},
  { i18n = i18nInstance, defaultNS = "common", initialLanguage = "en" } = {}
) => {
  i18n.language = initialLanguage;
  const DecoratedWithTranslation = appWithTranslationMock(Comp, {
    defaultNS,
    initialLanguage,
    i18n: i18nInstance
  });
  return render(
    <I18nextProvider
      i18n={i18n}
      defaultNS={defaultNS}
      initialLanguage={initialLanguage}
    >
      <DecoratedWithTranslation />
    </I18nextProvider>,
    renderOptions
  );
};

/**
 * If your component is wrapped in `withNamespaces` and uses
 * the custom `LanguageManager.Consumer` inside, you'll need to render it with the following util
 * which will do the same as `renderI18nNamespacesWrappedComponent` and also
 * wrap your component with a `LanguageManager.Provider`, so you can access:
 * - language
 * - defaultLanguageShortCode
 * - defaultLanguageFullCode
 * - switchDefaultLanguage
 *
 * It also wraps with a `LanguageManager.Consumer` (like in _app.tsx) in order to force re-render
 * when switchDefaultLanguage is called
 */
export const renderI18nWithLanguageManagerProvider = (
  Comp: typeof React.Component,
  renderOptions = {},
  {
    i18n = i18nInstance,
    defaultNS = "common",
    initialLanguage = "en",
    defaultLanguageShortCode = "en",
    defaultLanguageFullCode = "en-US"
  } = {}
) => {
  i18n.language = initialLanguage;
  const App = () => (
    <I18nextProvider
      i18n={i18nInstance}
      defaultNS={defaultNS}
      initialLanguage={initialLanguage}
    >
      <LanguageManagerProvider
        i18n={i18nInstance}
        defaultLanguageShortCode={defaultLanguageShortCode}
        defaultLanguageFullCode={defaultLanguageFullCode}
      >
        <LanguageManagerConsumer>
          {languageManagerCtx => <Comp {...languageManagerCtx} />}
        </LanguageManagerConsumer>
      </LanguageManagerProvider>
    </I18nextProvider>
  );
  const AppWithTranslation = appWithTranslationMock(App, {
    defaultNS,
    initialLanguage,
    i18n: i18nInstance
  });
  return render(<AppWithTranslation />, renderOptions);
};

export const withMobxStore = (initialState?: MyMobxStore) => (Comp: any) => {
  const mobxStore = createStore(initialState);
  return (props: any) => (
    <MobxProvider {...mobxStore}>
      <Comp {...props} />
    </MobxProvider>
  );
};

export const resetLanguage = ({
  initialLanguage = "en",
  defaultLanguageShortCode = "en",
  defaultLanguageFullCode = "en-US"
} = {}) => () => {
  i18nInstance.language = initialLanguage;
  setDefaultLanguageFromCookie(defaultLanguageShortCode);
  setDefaultLanguageFromCookie(defaultLanguageFullCode, true);
};
