// @ts-ignore
import ReactDOM from 'react-dom';
// @ts-ignore
import React, { useState } from 'react';
// @ts-ignore
import { Loading } from '@alifd/next';
// @ts-ignore
import mergeWith from 'lodash/mergeWith';
// @ts-ignore
import isArray from 'lodash/isArray';
import { buildComponents, assetBundle, AssetLevel, AssetLoader, AssetBundle, AssetItem} from '@alilc/lowcode-utils';
// @ts-ignore
import ReactRenderer from '@alilc/lowcode-react-renderer';
// @ts-ignore
import {injectComponents} from '@alilc/lowcode-plugin-inject';
import appHelper from './appHelper';
import {
  getProjectSchemaFromLocalStorage,
  getPackagesFromLocalStorage,
  getPreviewLocale,
  setPreviewLocale
} from './services/mockService';

const getScenarioName = function () {
  if (location.search) {
    return new URLSearchParams(location.search.slice(1)).get('scenarioName') || 'general';
  }
  return 'general';
}

const SamplePreview = () => {
  const [data, setData] = useState({});

  async function init() {
    const scenarioName = getScenarioName();
    const packages = getPackagesFromLocalStorage(scenarioName);
    const projectSchema = getProjectSchemaFromLocalStorage(scenarioName);
    const {
      componentsMap: componentsMapArray,
      componentsTree,
      i18n,
      dataSource: projectDataSource,
    } = projectSchema;
    const componentsMap: any = {};
    componentsMapArray.forEach((component: any) => {
      componentsMap[component.componentName] = component;
    });
    const pageSchema = componentsTree[0];

    const libraryMap = {};
    const libraryAsset: string | any[] | AssetBundle | AssetItem | null | undefined = [];
    // @ts-ignore
    packages.forEach(({ package: _package, library, urls, renderUrls }) => {
      // @ts-ignore
      libraryMap[_package] = library;
      if (renderUrls) {
        libraryAsset.push(renderUrls);
      } else if (urls) {
        libraryAsset.push(urls);
      }
    });

    const vendors = [assetBundle(libraryAsset, AssetLevel.Library)];

    //  asset may cause pollution
    const assetLoader = new AssetLoader();
    await assetLoader.load(libraryAsset);
    // @ts-ignore
    const components = await injectComponents(buildComponents(libraryMap, componentsMap));

    setData({
      schema: pageSchema,
      components,
      i18n,
      projectDataSource,
    });
  }

  const { schema, components, i18n = {}, projectDataSource = {} } = data as any;

  if (!schema || !components) {
    init();
    return <Loading fullScreen />;
  }
  const currentLocale = getPreviewLocale(getScenarioName());

  if (!(window as any).setPreviewLocale) {
    // for demo use only, can use this in console to switch language for i18n test
    // 在控制台 window.setPreviewLocale('en-US') 或 window.setPreviewLocale('zh-CN') 查看切换效果
    (window as any).setPreviewLocale = (locale:string) => setPreviewLocale(getScenarioName(), locale);
  }

  function customizer(objValue: [], srcValue: []) {
    if (isArray(objValue)) {
      return objValue.concat(srcValue || []);
    }
  }

  // @ts-ignore
  return (
    <div className="lowcode-plugin-sample-preview">
      <ReactRenderer
        className="lowcode-plugin-sample-preview-content"
        schema={{
          ...schema,
          dataSource: mergeWith(schema.dataSource, projectDataSource, customizer),
        }}
        components={components}
        locale={currentLocale}
        messages={i18n}
        appHelper={appHelper}
      />
    </div>
  );
};

ReactDOM.render(<SamplePreview />, document.getElementById('ice-container'));
