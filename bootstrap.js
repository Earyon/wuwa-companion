bootstrapCanonicalCatalog().catch(err=>dataErrorScreen(err));
companionActions['retry-start']=()=>bootstrapCanonicalCatalog().catch(dataErrorScreen);
