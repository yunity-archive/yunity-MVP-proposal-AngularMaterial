var app = angular.module('yunityWebApp', ['oc.lazyLoad', 'ngRoute','ngMaterial', 'ngMdIcons', 'ngResource']);


app.config(['$ocLazyLoadProvider', function($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({
        jsLoader: requirejs,
        debug: true
    });
}]);


app.controller('AppCtrl', function($scope, $mdSidenav, $log, $rootScope, yAPI) { 
    
    $rootScope.closeSideNav = function () {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav('left').close()
        .then(function () {
          $log.debug("close RIGHT is done");
        });
    };
    
    $scope.toggleSideNav = buildToggler('left');
    $scope.isOpenSideNav = function(){
      return $mdSidenav('left').isOpen();
    };
    
    function buildToggler(navID) {
      return function() {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav(navID)
          .toggle()
          .then(function () {
            $log.debug("toggle " + navID + " is done");
          });
      };
    }
});




app.factory("apiGroups", function($resource) {
  return $resource("/api/groups/:id");
});

app.factory("apiStores", function($resource) {
  return $resource("/api/stores/:id");
});


app.service('yAPI', function($rootScope, apiGroups, apiStores, $filter) {
    var yAPIdata = {
        groups: null,
        stores: null,
        users: [],
        activeGroup: {
            getStores: function(){
                if($rootScope.activeGroup == undefined) return;
                return $filter('filter')(yAPIdata.stores, {group: $rootScope.activeGroup.id}, true);
            }
        },
        getByID: function(type, value){
            value = parseInt(value);
            return $filter('filter')(yAPIdata[type], {id: value}, true);
        }
    };
    
    yAPIdata.groups = apiGroups.query(function() {
        $rootScope.activeGroup = yAPIdata.groups[0];
    });
    yAPIdata.stores = apiStores.query(function() {}); //query() returns all the entries
    
    return yAPIdata;
});


/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    // Home
    .when("/", {templateUrl: "partials/home/home.html", controller: "AppCtrl"})
    // Pages
    .when("/login", {templateUrl: "partials/login/login.html", controller: "AppCtrl"})
    // else 404
    .when("/groups/:id", {templateUrl: "partials/groups/groups.html", controller: "AppCtrl"})
    .when("/stores/:id", {templateUrl: "partials/stores/stores.html", controller: "AppCtrl"});
    
    /*.otherwise("/404", {templateUrl: "partials/404/404.html", controller: "AppCtrl"});*/
}]);




/******* communityPicker ******/
app.controller('communityPickerCtrl', function($scope, $rootScope, yAPI) {
    $scope.groups = yAPI.groups;
    
    $scope.setActiveGroup = function(selectedGroup){
            $rootScope.activeGroup = selectedGroup;
            $rootScope.closeSideNav()
            window.location.href = "#/groups/" + selectedGroup.id + "/";
    };
      
    $scope.openMenu = function($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };
});


/******* storePicker ******/
app.controller('storePickerCtrl', function($scope, $rootScope, yAPI) {
    $scope.stores = yAPI.activeGroup.getStores;
    
    $scope.loadStorePage = function(selectedStore){
            $rootScope.closeSideNav();
            window.location.href = "#/stores/" + selectedStore.id + "/";
    };
      
    $scope.openMenu = function($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };
});

/******* groupPageCtrl ******/
app.controller('groupPageCtrl', function($scope, $rootScope, yAPI, $routeParams) {
    $scope.group = function(){
        return yAPI.getByID("groups", $routeParams.id)[0];
    };
});

/******* groupPageCtrl ******/
app.controller('storePageCtrl', function($scope, $rootScope, yAPI, $routeParams) {
    $scope.store = function(){
        return yAPI.getByID("stores", $routeParams.id)[0];
    };
});

/******* autocomlete ******/
app.controller('autocompleteCtrl', function($scope, $rootScope, $q, yAPI) {
    
        var self = this;
    self.simulateQuery = false;
    self.isDisabled    = false;
    // list of `state` value/display objects
    self.entries = [];
    self.querySearch   = querySearch;
    self.selectedItemChange = selectedItemChange;
    self.searchTextChange   = searchTextChange;
    self.newState = newState;
    self.searchText = null;
    $scope.placeholder = "Search...";
    
    loadData();
    
    self.clear = function(){
        self.searchText = undefined;
    };
    
    function loadData(){
        $q.all([yAPI.groups, yAPI.stores]).then(function(result){
            self.entries = result[0];
        });
    }
    
    function newState(state) {
      alert("Sorry! This function is not yet implemented!");
    }
    // ******************************
    // Internal methods
    // ******************************
    /**
     * Search for states... use $timeout to simulate
     * remote dataservice call.
     */
    function querySearch (query) {
      var results = query ? self.entries.filter( createFilterFor(query) ) : self.entries,
          deferred;
      if (self.simulateQuery) {
        deferred = $q.defer();
        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
        return deferred.promise;
      } else {
        return results;
      }
    }
    function searchTextChange(text) {
      //$log.info('Text changed to ' + text);
    }
    function selectedItemChange(item) {
        if(item.name != undefined){
            $rootScope.activeGroup = item;
            //clear Input
            self.clear()
            //$scope.placeholder = item.name;
            window.location.href = "#/groups/" + item.id + "/";
        }       
    }
    
    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);
      return function filterFn(state) {
        var lowercaseName = angular.lowercase(state.name);
        return (lowercaseName.indexOf(lowercaseQuery) !== -1);
      };
    }
});


app.config(function($mdThemingProvider) {
    var yOrange = $mdThemingProvider.definePalette('yuniyColors', {
        '50': '363636', // yunity black
        '100': 'F5F5F5', // background grey
        '200': '91cb46', // yunity Green
        '300': 'fbaf36', // yunity yellow
        '400': '0290a2', // yunity blue 0290a2
        '500': 'f66c41', // yunity Orange
        '600': '2b9ccb', // blue for Links
        '700': 'FFFF00',
        '800': 'FF00FF',
        '900': '00FFFF',
        'A100': 'FF0000',
        'A200': 'f66c41', // yunity Orange
        'A400': '0000FF',
        'A700': '00FF00',
        'contrastDefaultColor': 'dark',
        'contrastLightColors': ['50', '100', //hues which contrast should be 'dark' by default
            '200', '300', '400', '500']
    });
  
  $mdThemingProvider.theme('default')
    .primaryPalette('yuniyColors')
    .accentPalette('yuniyColors');
});