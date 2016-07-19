var app = angular.module('yunityWebApp', ['oc.lazyLoad', 'ngRoute', 'ngMaterial', 'ngMdIcons', 'ngResource']);

app.config(['$ocLazyLoadProvider', function ($ocLazyLoadProvider) {
        $ocLazyLoadProvider.config({
            jsLoader: requirejs,
            debug: true
        });
    }]);



app.directive("yPickuplist", function () {
    return {
        template: ''
    };
});

app.filter("groupByDate", function ($filter) {
    var mArr = null,
            mGroupBy = null,
            mRetArr = null,
            getMemoArr = function (arr, groupBy) {
                var ret = {};
                angular.forEach(arr, function (item) {
                    var groupValue = item[groupBy];
                    groupValue = $filter('date')(groupValue, 'yyyy-MM-dd', '');
                    if (ret[groupValue]) {
                        ret[groupValue].push(item);
                    } else {
                        ret[groupValue] = [item];
                    }
                });
                return ret;
            };
    return function (arr) {
        groupBy = 'date';
        var newMemoArr = getMemoArr(arr, groupBy);

        if (mGroupBy !== groupBy || !angular.equals(mArr, newMemoArr)) {
            mArr = newMemoArr;
            mGroupBy = groupBy;
            mRetArr = [];
            var groups = {};
            angular.forEach(arr, function (item) {
                var groupValue = item[groupBy];
                groupValue = $filter('date')(groupValue, 'yyyy-MM-dd', '');
                if (groups[groupValue]) {
                    groups[groupValue].items.push(item);
                } else {
                    groups[groupValue] = {
                        items: [item]
                    };
                    groups[groupValue][groupBy] = groupValue;
                    mRetArr.push(groups[groupValue]);
                }
            });
        }
        return mRetArr;
    };
});


/******* communityPicker ******/
app.controller('storeCtrl', function ($scope, apiPickups) {
    $scope.updatePickups = function () {
        var pickups = apiPickups.query(function () {
            angular.forEach(pickups, function (value, key) {
                if (value.collector_ids.indexOf(1) !== -1) {
                    value.isUserMember = true;
                } else {
                    value.isUserMember = false;
                }
                
                if (value.collector_ids.length < value.max_collectors) {
                    value.isFull = false;
                } else {
                    value.isFull = true;
                }
                
            });
            $scope.pickups = pickups;
        });
    };

    $scope.updatePickups();

    $scope.pickupList = {
        showJoined: true,
        showOpen: true,
        showFull: true
    }

    $scope.reversed = true;
    $scope.toggleReversed = function () {
        $scope.reversed = !$scope.reversed;
    };
    
    $scope.filterPickups = function (pickup){
        if(pickup.isUserMember){
            return $scope.pickupList.showJoined;
        } else {
            if(pickup.isFull){
                return $scope.pickupList.showFull;
            } else {
                return $scope.pickupList.showOpen;
            }
        }
    }
});

app.controller('AppCtrl', function ($scope, $mdSidenav, $log, $rootScope, yAPI) {

    $rootScope.closeSideNav = function () {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav('left').close()
                .then(function () {
                    $log.debug("close RIGHT is done");
                });
    };

    $scope.toggleSideNav = buildToggler('left');
    $scope.isOpenSideNav = function () {
        return $mdSidenav('left').isOpen();
    };

    function buildToggler(navID) {
        return function () {
            // Component lookup should always be available since we are not using `ng-if`
            $mdSidenav(navID)
                    .toggle()
                    .then(function () {
                        $log.debug("toggle " + navID + " is done");
                    });
        };
    }
});




app.factory("apiGroups", function ($resource) {
    return $resource("/api/groups/:id");
});

app.factory("apiStores", function ($resource) {
    return $resource("/api/stores/:id");
});


app.factory("apiPickups", function ($resource) {
    return $resource("/api/pickup-dates/:id");
});


app.factory("apiUsers", function ($resource) {
    return $resource("/api/users/:id");
});


app.service('yAPI', function ($rootScope, apiGroups, apiStores, apiPickups, apiUsers, $filter) {
    var yAPIdata = {
        groups: null,
        stores: null,
        users: null,
        activeGroup: {
            getStores: function () {
                if ($rootScope.activeGroup == undefined)
                    return;
                return $filter('filter')(yAPIdata.stores, {group: $rootScope.activeGroup.id}, true);
            }
        },
        getByID: function (type, value) {
            value = parseInt(value);
            return $filter('filter')(yAPIdata[type], {id: value}, true)[0];
        }
    };

    yAPIdata.groups = apiGroups.query(function () {
        $rootScope.activeGroup = yAPIdata.groups[0];
    });
    yAPIdata.stores = apiStores.query(function () {}); //query() returns all the entries
    
    yAPIdata.users = apiUsers.query(function () {}); //query() returns all the entries

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
                .when("/chat/:id", {templateUrl: "partials/chat/chat.html", controller: "AppCtrl"})
                .when("/stores/:id", {templateUrl: "partials/stores/stores.html", controller: "AppCtrl"});

        /*.otherwise("/404", {templateUrl: "partials/404/404.html", controller: "AppCtrl"});*/
    }]);




/******* communityPicker ******/
app.controller('communityPickerCtrl', function ($scope, $rootScope, yAPI) {
    $scope.groups = yAPI.groups;
    $scope.show = true;

    $scope.setActiveGroup = function (selectedGroup) {
        $rootScope.activeGroup = selectedGroup;
        $rootScope.closeSideNav()
        window.location.href = "#/groups/" + selectedGroup.id + "/";
    };

    $scope.openMenu = function ($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };
});


/******* storePicker ******/
app.controller('storePickerCtrl', function ($scope, $rootScope, yAPI) {
    $scope.stores = yAPI.activeGroup.getStores;
    $scope.show = true;

    $scope.loadStorePage = function (selectedStore) {
        $rootScope.closeSideNav();
        window.location.href = "#/stores/" + selectedStore.id + "/";
    };

    $scope.openMenu = function ($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };
});

/******* groupPageCtrl ******/
app.controller('groupPageCtrl', function ($scope, $rootScope, yAPI, $routeParams) {
    $scope.group = function () {
        return yAPI.getByID("groups", $routeParams.id);
    };
});

/******* groupPageCtrl ******/
app.controller('storePageCtrl', function ($scope, $rootScope, yAPI, $routeParams) {
    $scope.store = function () {
        return yAPI.getByID("stores", $routeParams.id);
    };
});

/******* chat ******/
app.controller('chatCtrl', function ($scope, $mdSidenav, yAPI, $routeParams) {
    $scope.users = yAPI.users;
    $scope.currentUser = yAPI.getByID("users", $routeParams.id);
    
    $scope.closeUserList = function () {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav('userList').close()
                .then(function () {
                    $log.debug("close RIGHT is done");
                });
    };

    $scope.toggleUserList = buildToggler('userList');
    $scope.isOpenUserList = function () {
        return $mdSidenav('userList').isOpen();
    };

    function buildToggler(navID) {
        return function () {
            // Component lookup should always be available since we are not using `ng-if`
            $mdSidenav(navID)
                    .toggle()
                    .then(function () {
                        $log.debug("toggle " + navID + " is done");
                    });
        };
    }
});


/******* chat Header ******/
app.controller('chatHeaderCtrl', function ($scope, $rootScope, yAPI) {
    $scope.users = yAPI.users;
});

/******* autocomlete ******/
app.controller('autocompleteCtrl', function ($scope, $rootScope, $q, yAPI) {

    var self = this;
    self.simulateQuery = false;
    self.isDisabled = false;
    // list of `state` value/display objects
    self.entries = [];
    self.querySearch = querySearch;
    self.selectedItemChange = selectedItemChange;
    self.searchTextChange = searchTextChange;
    self.newState = newState;
    self.searchText = null;
    $scope.placeholder = "Search...";

    loadData();

    self.clear = function () {
        self.searchText = undefined;
    };

    function loadData() {
        $q.all([yAPI.groups, yAPI.stores]).then(function (result) {
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
    function querySearch(query) {
        var results = query ? self.entries.filter(createFilterFor(query)) : self.entries,
                deferred;
        if (self.simulateQuery) {
            deferred = $q.defer();
            $timeout(function () {
                deferred.resolve(results);
            }, Math.random() * 1000, false);
            return deferred.promise;
        } else {
            return results;
        }
    }
    function searchTextChange(text) {
        //$log.info('Text changed to ' + text);
    }
    function selectedItemChange(item) {
        if (item.name != undefined) {
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


app.config(function ($mdThemingProvider) {
    var yOrange = $mdThemingProvider.definePalette('yuniyColors', {
        '50': '363636', // yunity black
        '100': 'F5F5F5', // background grey
        '200': '91cb46', // yunity Green
        '300': 'fbaf36', // yunity yellow
        '400': '0290a2', // yunity blue 0290a2
        '500': 'f66c41', // yunity Orange
        '600': '2b9ccb', // blue for Links
        '700': 'FFFF00',
        '800': '3572B0', // Chat Blue
        '900': '00FFFF',
        'A100': '91cb46',
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