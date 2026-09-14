Promise.all([loadLocalization(),loadBundledCatalog(),loadGameAssets()]).then(()=>bootstrapCanonicalCatalog()).then(()=>maybeShowTutorial()).catch(dataErrorScreen);
companionActions['retry-start']=()=>bootstrapCanonicalCatalog().catch(dataErrorScreen);
