var app = angular.module('yunityWebApp', ['ngRoute', 'ngCookies', 'xeditable', 'ngMaterial', 'ngMdIcons', 'ngResource', 'leaflet-directive']);

app.config(function ($resourceProvider) {
    $resourceProvider.defaults.stripTrailingSlashes = false;
});


/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider
                .when("/", {title: 'yunity | Home', templateUrl: "partials/home/home.html", controller: "homePageCtrl as ctrl"})
                .when("/groups/:id", {title: 'yunity | Group', templateUrl: "partials/groups/groups.html", controller: "groupPageCtrl as ctrl"})
                .when("/chat/:id", {title: 'yunity | Chat', templateUrl: "partials/chat/chat.html", controller: "chatCtrl as ctrl"})
                .when("/profile/:id", {title: 'yunity | Profile', templateUrl: "partials/profile/profile.html", controller: "profilePageCtrl as ctrl"})
                .when("/stores/:id", {title: 'yunity | Store', templateUrl: "partials/stores/stores.html", controller: "storePageCtrl as ctrl"});

        /*.otherwise("/404", {templateUrl: "partials/404/404.html", controller: "AppCtrl"});*/
    }]);

app.config(function ($mdThemingProvider) {
    var yPrimary = $mdThemingProvider.definePalette('yuniyColors', {
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

    var yAccent = $mdThemingProvider.extendPalette('yuniyColors', {
    });

    // Register the new color palette map with the name <code>neonRed</code>
    $mdThemingProvider.definePalette('yAccent', yAccent);

    $mdThemingProvider.theme('default')
            .primaryPalette('yuniyColors')
            .accentPalette('yAccent');
});

// Set Title for current page
app.run(['$rootScope', '$route', function ($rootScope, $route) {
        $rootScope.$on('$routeChangeSuccess', function () {
            document.title = $route.current.title;
        });
    }]);


/****************** Directives **********************/

app.directive("yMapPicker", function () {
    return {
        templateUrl: 'directives/yMapPicker/yMapPicker.html',
        scope: {
            updateFunction: "&",
            position: "=",
            height: "@",
            width: "@",
            markers: "=",
            disabled: "="
        }
    };
});

app.directive("yPickupList", function () {
    return {
        templateUrl: 'directives/yPickupList/yPickupList.html',
        scope: {
            showCreateButton: "@",
            header: "@",
            showDetail: "@",
            groupId: "@",
            storeId: "@"
        }
    };
});

/************* Factories **************/
app.factory("apiGroups", function ($resource) {
    return $resource("/api/groups/:id/", null,
            {
                'update': {method: 'PUT'},
                'delete': {method: 'DELETE'}
            });
});

app.factory("apiStores", function ($resource) {
    return $resource("/api/stores/:id/", null,
            {
                'update': {method: 'PUT'},
                'delete': {method: 'DELETE'}
            });
});

app.factory("apiPickups", function ($resource) {
    return $resource("/api/pickup-dates/:id/");
});

app.factory("apiUsers", function ($resource) {
    return $resource("/api/users/:id/", null,
            {
                'update': {method: 'PUT'},
                'delete': {method: 'DELETE'}
            });
});

app.factory("apiAuth", function ($resource) {
    return $resource("/api/auth/status/");
});

/************* Filter *****************/

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

/*********** Controller **************/

app.controller('autocompleteCtrl', function ($rootScope, $q, yAPI) {

    var self = this;
    self.simulateQuery = false;
    self.isDisabled = false;
    // list of `state` value/display objects
    self.entries = [];
    self.querySearch = querySearch;
    self.selectedItemChange = selectedItemChange;
    self.searchTextChange = searchTextChange;
    self.searchText = null;
    self.placeholder = "Search...";

    loadData();

    self.clear = function () {
        self.searchText = undefined;
    };

    function loadData() {
        $q.all([yAPI.groups, yAPI.stores]).then(function (result) {
            self.entries = result[0];
        });
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
        if (item.name !== undefined) {
            $rootScope.activeGroup = item;
            //clear Input
            self.clear();
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

app.controller('AppCtrl', function ($scope, $mdSidenav, $log, $mdComponentRegistry, $rootScope, $mdPanel, $http, $cookies) {

    $http.defaults.headers.common['X-CSRFToken'] = $cookies.get('csrftoken');

    $rootScope._mdPanel = $mdPanel;
    $mdComponentRegistry.when('left').then(function (it) {
        it.close();
    });

    // Update Login Status
    $rootScope.loggedInUserData = $http.get('/api/auth/status').
            success(function (data) {
                if (data.display_name !== "") {
                    $rootScope.loggedInUserData = data;
                } else {
                    window.location.href = "/login/index.html";
                }
            });

    $rootScope.closeSideNav = function () {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav('left').close()
                .then(function () {
                    $log.debug("close RIGHT is done");
                });
    };

    $rootScope.openPanel = function (panelName) {
        $rootScope.closeSideNav();
        var position = $rootScope._mdPanel.newPanelPosition()
                .absolute()
                .center();
        var config = {
            attachTo: angular.element(document.body),
            controller: PanelDialogCtrl,
            controllerAs: 'ctrl',
            disableParentScroll: false,
            templateUrl: 'panels/' + panelName + '/' + panelName + '.html',
            hasBackdrop: true,
            panelClass: 'dialogue-wide',
            position: position,
            trapFocus: true,
            zIndex: 150,
            clickOutsideToClose: true,
            escapeToClose: true,
            focusOnOpen: true
        };
        $rootScope._mdPanel.open(config);
    };

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
    ;


    $scope.toggleSideNav = buildToggler('left');


});

app.controller('chatCtrl', function ($scope, $mdSidenav, yAPI, $routeParams) {
    $scope.users = yAPI.users;
    $scope.currentUser = yAPI.getByID("users", $routeParams.id);

    $scope.closeUserList = function () {
        // Component lookup should always be available since we are not using `ng-if`
        $mdSidenav('userList').close();
    };

    $scope.toggleUserList = buildToggler('userList');
    $scope.isOpenUserList = function () {
        return $mdSidenav('userList').isOpen();
    };

    function buildToggler(navID) {
        return function () {
            // Component lookup should always be available since we are not using `ng-if`
            $mdSidenav(navID)
                    .toggle();
        };
    }
});

app.controller('chatHeaderCtrl', function (yAPI) {
    this.users = yAPI.users;
});

app.controller('communityPickerCtrl', function ($timeout, $rootScope, yAPI) {
    self = this;
    yAPI.updateGroups();
    self.groups = yAPI.groups;
    self.show = false;

    $timeout(self.updateActiveGroup, 3000);

    self.isUserMemberOfGroup = function (group) {
        return (group.members.indexOf($rootScope.loggedInUserData.id) !== -1);
    };

    self.setActiveGroup = function (selectedGroup) {
        $rootScope.activeGroup = selectedGroup;
        $rootScope.closeSideNav();
        self.show = false;
        window.location.href = "#/groups/" + selectedGroup.id + "/";
    };
});

app.controller('groupPageCtrl', function (apiUsers, apiGroups, apiStores, $routeParams) {
    self = this;
    self.stores = apiStores.query({group: $routeParams.id}, function (stores) {
        self.markers = {};

        stores.forEach(function (store) {
            self.markers[store.id] = {
                lat: store.latitude,
                lng: store.longitude,
                message: store.name
            };
        });
    });

    self.currentPosition = {
        lat: 49.9,
        lng: 8.660232,
        zoom: 3
    };

    self.group = apiGroups.get({id: $routeParams.id}, function () {
        if (self.group !== undefined) {
            self.group.members = self.group.members.map(self.mapUsers);

            self.currentPosition = {
                lat: self.group.latitude,
                lng: self.group.longitude,
                zoom: 12
            };
        }
    });
    self.group.id = $routeParams.id;


    self.updateMarkerPosFn = function (position) {
        self.createdPosition = position;
    };

    self.mapUsers = function (number) {
        return apiUsers.get({id: number}, function () {});
    };

    self.loadStorePage = function (selectedStore) {
        window.location.href = "#/stores/" + selectedStore.id + "/";
    };

    self.updateInfo = function (data) {
        if (self.createdPosition !== undefined) {
            self.group.latitude = self.createdPosition.lat;
            self.group.longitude = self.createdPosition.lng;

            self.currentPosition = {
                lat: self.group.latitude,
                lng: self.group.longitude,
                zoom: 11
            };
        }
        apiGroups.update({id: self.group.id}, self.group);
    };

    self.deleteGroup = function () {
        apiGroups.delete({id: self.group.id}, self.group);
        window.location.href = "index.html#";
    }

}
);
app.controller('groupPickerCtrl', function ($rootScope, apiGroups, yPostReq) {
    self = this;
    self.groups = apiGroups.query(function (groups) {
        groups.forEach(function (group) {
            if (group.members.indexOf($rootScope.loggedInUserData.id) !== -1) {
                group.isUserMember = true;
                group.selected = true;
            }

        });
        self.groups = groups;
        console.log(self.groups);
    });

    self.changeGroupMembership = function (groupToChange) {
    };

    self.updateGroupInfo = function () {
        self.groups.forEach(function (groupToChange) {
            if (groupToChange.isUserMember !== groupToChange.selected) {
                if (groupToChange.selected) {
                    yPostReq.req('api/groups/' + groupToChange.id + '/join/', {}, self.updateGroups(), self.updateGroups());
                } else {
                    yPostReq.req('api/groups/' + groupToChange.id + '/leave/', {}, self.updateGroups(), self.updateGroups());
                }
            }
        });
        location.reload();
    };

    self.updateGroups = function () {

    };
});

app.controller('HeaderCtrl', function (yPostReq) {
    var self = this;
    self.logoutdata = {
        email: "",
        password: ""
    };

    self.logout = function () {
        yPostReq.req('/api/auth/logout/', self.logoutdata, self.logoutSuccess, self.logoutError);
    };

    self.logoutSuccess = function () {
        window.location.href = "login/index.html";
    };
    self.logoutError = function () {
        alert("error");
    };
});

app.controller('homePageCtrl', function ($rootScope) {

    //redirect, since there is nothing to show here yet
    location.href = "#/groups/" + $rootScope.activeGroup.id;
});

app.controller('PanelDialogCtrl', PanelDialogCtrl);

app.controller('pickupListCtrl', function (apiStores, apiPickups, $scope, $http, $rootScope) {
    var self = this;

    self.updatePickups = function () {
        if ($scope.groupId !== undefined) {
            apiPickups.query({group: $scope.groupId}, self.addPickuplistInfos);
        } else if ($scope.storeId !== undefined) {
            apiPickups.query({store: $scope.storeId}, self.addPickuplistInfos);            
        } else {
            apiPickups.query({}, self.addPickuplistInfos);      
        }
    };

    self.addPickuplistInfos = function(pickups){
        angular.forEach(pickups, function (value, key) {
            if (value.collector_ids.indexOf($rootScope.loggedInUserData.id) !== -1) {
                value.isUserMember = true;
            } else {
                value.isUserMember = false;
            }

            if (value.collector_ids.length < value.max_collectors) {
                value.isFull = false;
            } else {
                value.isFull = true;
            }

            if ($scope.showDetail === 'store') {
                value.store = apiStores.get({id: value.store});
            }

        });
        self.pickups = pickups;
    }

    self.updatePickups();

    self.openPanel = $rootScope.openPanel;

    self.pickupList = {
        showJoined: true,
        showOpen: true,
        showFull: false
    };

    self.join = function (id) {
        $http.post('api/pickup-dates/' + id + '/add/', {}).then(self.updatePickups(), null);
    };

    self.leave = function (id) {
        $http.post('api/pickup-dates/' + id + '/remove/', {}).then(self.updatePickups(), null);
    };

    self.reversed = false;

    self.toggleReversed = function () {
        self.reversed = !self.reversed;
    };

    self.filterPickups = function (pickup) {
        if (pickup.isUserMember) {
            return self.pickupList.showJoined;
        } else {
            if (pickup.isFull) {
                return self.pickupList.showFull;
            } else {
                return self.pickupList.showOpen;
            }
        }
    };
});

app.controller('yMapPickerCtrl', function ($scope) {
    var self = this;
    self.markers = $scope.markers;

    $scope.$watch('markers', function () {
        self.markers = $scope.markers;
    });

    $scope.$on('leafletDirectiveMap.click', function (event, args) {
        if (!$scope.disabled) {

            var leafEvent = args.leafletEvent;
            var currentMarkerPosition = {
                lat: leafEvent.latlng.lat,
                lng: leafEvent.latlng.lng
            };
            self.markers = [currentMarkerPosition];
            $scope.updateFunction({position: currentMarkerPosition});
        }
    });

    self.markers = new Array();

    angular.extend(self, {
        events: {
            map: {
                enable: ['click'],
                logic: 'emit'
            }
        }
    });
});

app.controller('profilePageCtrl', function (apiUsers, apiGroups, $routeParams) {
    self = this;
    self.profile = apiUsers.get({id: $routeParams.id}, function () {
        self.currentPosition = {
            lat: self.profile.latitude,
            lng: self.profile.longitude,
            zoom: 14
        }
    });
    self.groups = apiGroups.query({members: $routeParams.id}, function () {});


    self.updateMarkerPosFn = function (position) {
        self.createdPosition = position;
    };

    self.updateInfo = function (data) {
        if (self.createdPosition !== undefined) {
            self.profile.latitude = self.createdPosition.lat;
            self.profile.longitude = self.createdPosition.lng;

            self.currentPosition = {
                lat: self.profile.latitude,
                lng: self.profile.longitude,
                zoom: 11
            };
        }
        apiUsers.update({id: self.profile.id}, self.profile);
    };
});

app.controller('storePageCtrl', function ($rootScope, apiStores, $routeParams, $timeout) {
    self = this;

    self.store = apiStores.get({id: $routeParams.id}, function () {
        if (self.store !== undefined) {
            createMarker();
        }
    });
    self.store.id = $routeParams.id;

    $rootScope.currentStoreId = $routeParams.id;

    angular.extend(self, {
        currentStore: {
            lat: 49.9,
            lng: 8.660232,
            zoom: 12
        }
    });


    self.updateMarkerPosFn = function (position) {
        self.createdPosition = position;
    };

    function createMarker() {
        angular.extend(self, {
            currentStore: {
                lat: self.store.latitude,
                lng: self.store.longitude,
                zoom: 14
            },
            markers: {
                m1: {
                    lat: self.store.latitude,
                    lng: self.store.longitude,
                    message: self.store.name
                }
            }
        });
    }
    ;


    self.updateInfo = function (data) {
        if (self.createdPosition !== undefined) {
            self.store.latitude = self.createdPosition.lat;
            self.store.longitude = self.createdPosition.lng;
        }
        apiStores.update({id: self.store.id}, self.store);
    };

    self.deleteStore = function () {
        apiStores.delete({id: self.store.id}, self.store);
        window.location.href = "index.html#";
    }
});

app.controller('storePickerCtrl', function ($rootScope, yAPI) {
    self = this;
    self.stores = yAPI.activeGroup.getStores;
    self.show = true;
    self.showPanel = function () {
        return $rootScope.activeGroup !== undefined;
    };

    self.loadStorePage = function (selectedStore) {
        $rootScope.closeSideNav();
        window.location.href = "#/stores/" + selectedStore.id + "/";
    };

    self.openMenu = function ($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };
});

/******* Services ********/

app.service('yAPI', function ($rootScope, apiGroups, apiStores, apiPickups, apiUsers, $filter) {
    var yAPIdata = {
        groups: null,
        stores: null,
        users: null,
        activeGroup: {
            getStores: function () {
                if ($rootScope.activeGroup === undefined)
                    return;
                return $filter('filter')(yAPIdata.stores, {group: $rootScope.activeGroup.id}, true);
            }
        },
        getByID: function (type, value) {
            value = parseInt(value);
            return $filter('filter')(yAPIdata[type], {id: value}, true)[0];
        },
        updateGroups: function () {
            yAPIdata.groups = apiGroups.query(function (groups) {
                groups.forEach(function (group) {
                    if (group.members.indexOf($rootScope.loggedInUserData.id) !== -1) {
                        $rootScope.activeGroup = group;
                    }

                });
            });
        }
    };

    yAPIdata.updateGroups();

    yAPIdata.stores = apiStores.query(function () {}); //query() returns all the entries

    yAPIdata.users = apiUsers.query(function () {}); //query() returns all the entries

    return yAPIdata;
});

app.service('yPostReq', function ($http, $cookies) {
    //var csrfmiddlewaretoken = $cookies.get('csrftoken');
    var yPostReq = {
        req: function (path, data, success, error) {
            $http.post(path, data).then(success, error);
        }
    };

    return yPostReq;
});

function PanelDialogCtrl(mdPanelRef, $rootScope, yPostReq) {
    thisDialog = this;
    thisDialog._mdPanelRef = mdPanelRef;
    thisDialog.activeGroup = $rootScope.activeGroup;
    if (thisDialog.activeGroup != undefined) {
        thisDialog.position = {
            lat: thisDialog.activeGroup.latitude,
            lng: thisDialog.activeGroup.longitude,
            zoom: 10
        };
    }

    thisDialog.updateMarkerPosFn = function (position) {
        thisDialog.createdPosition = position;
    };


    thisDialog.openPanel = function (panelName) {
        thisDialog.closeDialog();
        $rootScope.openPanel(panelName);
    };

    thisDialog.createGroup = function () {
        thisDialog.groupData.latitude = thisDialog.createdPosition.lat;
        thisDialog.groupData.longitude = thisDialog.createdPosition.lng;
        yPostReq.req('/api/groups/', thisDialog.groupData, thisDialog.refreshPage, thisDialog.closeDialog);
    };

    thisDialog.createPickup = function () {
        // get current store
        // mix date and time to datestring
        var newDate = new Date(thisDialog.pickupData.date);
        newDate.setHours(thisDialog.pickupData.time.getHours());
        newDate.setMinutes(thisDialog.pickupData.time.getMinutes());

        var dataToSend = {
            max_collectors: thisDialog.pickupData.max_collectors,
            date: newDate,
            store: $rootScope.currentStoreId
        };

        yPostReq.req('/api/pickup-dates/', dataToSend, thisDialog.refreshPage, thisDialog.closeDialog);
    };

    thisDialog.createStore = function () {
        thisDialog.storeData.latitude = thisDialog.createdPosition.lat;
        thisDialog.storeData.longitude = thisDialog.createdPosition.lng;
        thisDialog.storeData.group = thisDialog.activeGroup.id;
        yPostReq.req('/api/stores/', thisDialog.storeData, thisDialog.refreshPage, thisDialog.closeDialog);
    };

    thisDialog.closeDialog = function () {
        thisDialog._mdPanelRef && thisDialog._mdPanelRef.close();
    };


    thisDialog.refreshPage = function () {
        location.reload();
    };
}