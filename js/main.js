require.config({
  baseUrl: 'js/',
  paths: {
    'ocLazyLoad': 'ocLazyLoad/ocLazyLoad.require',
    'app': 'app'
  },
  shim: { 
    'app': ['ocLazyLoad']
  }
});

// Start the main app logic.
require(['app'], function() {
  angular.bootstrap(document.body, ['yunityWebApp']);
});
