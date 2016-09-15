var app = angular.module('yunityWebApp', ['ui.router', 'ngRoute', 'ngCookies', 'xeditable', 'ngMaterial', 'ngMdIcons', 'ngResource', 'leaflet-directive']);

app.config(function ($resourceProvider) {
    $resourceProvider.defaults.stripTrailingSlashes = false;
});


/**
 * Configure the Routes
 */
app.config(function ($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/home");


    // Now set up the states
    $stateProvider
            .state('home', {
                url: "/home",
                templateUrl: "partials/home/home.html",
                title: 'yunity | Home',
                controller: "homePageCtrl",
                controllerAs: "ctrl"
            })
            .state('groups', {
                url: "/groups/:id",
                templateUrl: "partials/groups/groups.html",
                title: 'yunity | Group',
                controller: "groupPageCtrl",
                controllerAs: "ctrl",
                resolve: {
                    group: function (apiGroups, $stateParams) {
                        return apiGroups.get({id: $stateParams.id}).$promise;
                    },
                    stores: function (apiStores, $stateParams) {
                        return apiStores.query({group: $stateParams.id}).$promise;
                    }
                }
            })
            .state('stores', {
                url: "/stores/:id",
                templateUrl: "partials/stores/stores.html",
                title: 'yunity | Store',
                controller: "storePageCtrl",
                controllerAs: "ctrl"
            })
            .state('profile', {
                url: "/profile/:id",
                templateUrl: "partials/profile/profile.html",
                title: 'yunity | Profile',
                controller: "profilePageCtrl",
                controllerAs: "ctrl",
                resolve: {
                    profile: function ($stateParams, apiUsers) {
                        return apiUsers.get({id: $stateParams.id}).$promise;
                    },
                    groups: function ($stateParams, apiGroups) {
                        return apiGroups.query({members: $stateParams.id}).$promise;
                    }
                }
            })
            .state('chat', {
                url: "/chat/:id",
                templateUrl: "partials/chat/chat.html",
                title: 'yunity | Chat',
                controller: "chatPageCtrl",
                controllerAs: "ctrl",
                resolve: {
                    users: function (apiUsers) {
                        return apiUsers.query().$promise;
                    },
                    currentUser: function (apiUsers, $stateParams) {
                        return apiUsers.get({id: $stateParams.id}).$promise;
                    }
                }
            });
});

app.config(function ($mdThemingProvider) {
    $mdThemingProvider.definePalette('yuniyColors', {
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
        'A100': '91cb46', // yunity green
        'A200': 'f66c41', // yunity orange
        'A400': '0000FF',
        'A700': '00FF00',
        'contrastDefaultColor': 'dark',
        'contrastLightColors': ['50', '100', //hues which contrast should be 'dark' by default
            '200', '300', '400', '500']
    });

    var yAccent = $mdThemingProvider.extendPalette('yuniyColors', {});

    // Register the new color palette map with the name <code>neonRed</code>
    $mdThemingProvider.definePalette('yAccent', yAccent);

    $mdThemingProvider.theme('default')
            .primaryPalette('yuniyColors')
            .accentPalette('yAccent');
});


/************************* Components ****************************/
/**** Community Picker ***/
app.component("yCommunityPicker", {
    templateUrl: 'components/yCommunityPicker/yCommunityPicker.html',
    controller: 'yCommunityPickerCtrl'
});

app.controller('yCommunityPickerCtrl', function (yActiveGroup, $rootScope, apiGroups, yAuthService, $state) {
    self = this;
    self.groups = apiGroups.query({members: yAuthService.userData.id});
    self.show = false;
    self.activeGroup = yActiveGroup.get;
    self.openPanel = $rootScope.openPanel;

    self.isUserMemberOfGroup = function (group) {
        return (group.members.indexOf(yAuthService.userData.id) !== -1);
    };

    self.setActiveGroup = function (selectedGroup) {
        yActiveGroup.set(selectedGroup);

        $rootScope.closeSideNav();
        self.show = false;

        $state.go("groups", {id: selectedGroup.id}, { reload: true });
    };
});

/**** Community Picker ***/
app.component("yStorePicker", {
    templateUrl: 'components/yStorePicker/yStorePicker.html',
    controller: 'yStorePickerCtrl'
});

app.controller('yStorePickerCtrl', function (yActiveGroup, $rootScope, yAPI, $state) {
    self = this;
    self.stores = yAPI.activeGroup.getStores;
    self.show = true;
    self.openPanel = $rootScope.openPanel;

    self.showPanel = function () {
        return (yActiveGroup.get() !== undefined);
    };

    self.loadStorePage = function (selectedStore) {
        $rootScope.closeSideNav();
        $state.go("stores", {id: selectedStore.id});
    };

    self.openMenu = function ($mdOpenMenu, ev) {
        $mdOpenMenu(ev);
    };
});

/**** Map Picker ***/
app.component("yMapPicker", {
    templateUrl: 'components/yMapPicker/yMapPicker.html',
    controller: 'yMapPickerCtrl',
    bindings: {
        updateFunction: "&",
        disabled: "<",
        markers: "<",
        position: "<",
        height: "@",
        width: "@"
    }
});

app.controller('yMapPickerCtrl', function ($scope) {
    var self = this;

    $scope.$on('leafletDirectiveMap.click', function (event, args) {
        if (!self.disabled) {
            var currentMarkerPosition = {
                lat: args.leafEvent.latlng.lat,
                lng: args.leafEvent.latlng.lng
            };
            self.markers = [currentMarkerPosition];
            self.updateFunction({position: currentMarkerPosition});
        }
    });

    angular.extend(self, {
        events: {
            map: {
                enable: ['click'],
                logic: 'emit'
            }
        }
    });
});

/**** Pickup List ***/

app.component("yPickupList", {
    templateUrl: 'components/yPickupList/yPickupList.html',
    controller: 'pickupListCtrl',
    bindings: {
        showCreateButton: "@",
        header: "@",
        showDetail: "@",
        groupId: "@",
        storeId: "@"
    }
});


app.controller('pickupListCtrl', function (apiStores, apiPickups, $rootScope) {
    var self = this;
    self.addPickuplistInfos = addPickuplistInfos;
    self.filterPickups = filterPickups;
    self.openPanel = $rootScope.openPanel;
    self.reversed = false;
    self.toggleReversed = toggleReversed;
    self.updatePickups = updatePickups;

    self.pickupList = {
        showJoined: true,
        showOpen: true,
        showFull: false
    };
    
    self.updatePickups();
    
    
    function addPickuplistInfos(pickups) {
        angular.forEach(pickups, function (value) {
            value.isUserMember = (value.collector_ids.indexOf($rootScope.loggedInUserData.id) !== -1);
            value.isFull = !(value.collector_ids.length < value.max_collectors);

            if (self.showDetail === 'store') {
                value.store = apiStores.get({id: value.store});
            }
        });
        self.pickups = pickups;
    };
    
    function filterPickups(pickup) {
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
    
    function toggleReversed() {
        self.reversed = !self.reversed;
    };
    
    function updatePickups() {
        var filter = {};
        if (self.groupId !== undefined) {
            filter = {group: self.groupId};
        } else if (self.storeId !== undefined) {
            filter = {store: self.storeId};
        }
        apiPickups.query(filter, self.addPickuplistInfos);
    };
});


/**** Pickup List Item ***/

app.component("yPickupListItem", {
    templateUrl: 'components/yPickupListItem/yPickupListItem.html',
    controller: 'yPickupListItemCtrl',
    bindings: {
        data: "<",
        showDetail: "<",
        updateFn: "<"
    }
});

app.controller('yPickupListItemCtrl', function (apiStores, apiPickups, $scope, $http, $rootScope) {
    var self = this;

    self.join = function (id) {
        $http.post('api/pickup-dates/' + id + '/add/', {}).then(self.updateFn(), null);
    };

    self.leave = function (id) {
        $http.post('api/pickup-dates/' + id + '/remove/', {}).then(self.updateFn(), null);
    };
});

/****************** Directives **********************/

app.directive('yLogoutButton', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {},
        templateUrl: 'directives/yLogoutDirective/yLogoutDirective.html'
    };
});

app.controller('LogoutCtrl', function (yPostReq) {
    var self = this;

    self.logout = function () {
        yPostReq.req('/api/auth/logout/', {email: "", password: ""}, self.logoutSuccess, self.logoutError);
    };

    self.logoutSuccess = function () {
        window.location.href = "login/index.html";
    };
    self.logoutError = function () {
        alert("error");
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


    function querySearch(query) {
        var results = query ? self.entries.filter(createFilterFor(query)) : self.entries;
        return results;
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

app.controller('AppCtrl', function (yAuthService, $scope, $mdSidenav, $log, $mdComponentRegistry, $rootScope, $mdPanel, $http, $cookies) {
    appCtrl = this;

    $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        if (toState.resolve) {
            appCtrl.showSpinner = true;
        }
    });
    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        if (toState.resolve) {
            appCtrl.showSpinner = false;
        }
    });


    // always include csrf-token in requests
    $http.defaults.headers.common['X-CSRFToken'] = $cookies.get('csrftoken');

    // **** Panels ****/
    $rootScope._mdPanel = $mdPanel;

    $rootScope.closeSideNav = function () {
        $mdSidenav('left').close()
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

    //***** Side Nav *****/

    $mdComponentRegistry.when('left').then(function (it) {
        it.close();
    });

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


    $rootScope.loggedInUserData = yAuthService.updateStatus().then(function (result) {
        $rootScope.loggedInUserData = result.data;
    });
});

app.controller('chatPageCtrl', function ($scope, $mdSidenav, users, currentUser) {
    $scope.users = users;
    $scope.currentUser = currentUser;

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

app.controller('groupPageCtrl', function (apiUsers, apiGroups, group, stores) {
    self = this;
    self.deleteGroup = deleteGroup;
    self.loadStorePage = loadStorePage;
    self.group = group;
    self.stores = stores;
    self.mapUsers = mapUsers;
    self.markers = {};
    self.updateInfo = updateInfo;
    self.updateMarkerPosFn = updateMarkerPosFn;

    self.stores.forEach(function (store) {
        self.markers[store.id] = {
            lat: store.latitude,
            lng: store.longitude,
            message: store.name
        };
    });
    
    self.group.members = self.group.members.map(self.mapUsers);

    self.currentPosition = {
        lat: self.group.latitude,
        lng: self.group.longitude,
        zoom: 12
    };
    
    function deleteGroup() {
        apiGroups.delete({id: self.group.id}, self.group);
        window.location.href = "index.html#";
    };
    
    function loadStorePage(selectedStore) {
        window.location.href = "#/stores/" + selectedStore.id + "/";
    };

    function mapUsers(number) {
        return apiUsers.get({id: number}, function () {});
    };
    
    function updateInfo(data) {
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
    
    function updateMarkerPosFn(position) {
        self.createdPosition = position;
    };
});
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

app.controller('homePageCtrl', function (yActiveGroup) {
    //redirect, since there is nothing to show here yet
    location.href = "#/groups/" + yActiveGroup.get();
});

app.controller('profilePageCtrl', function (apiUsers, profile, groups) {
    self = this;
    self.groups = groups;
    self.profile = profile;
    self.updateInfo = updateInfo;
    self.updateMarkerPosFn = updateMarkerPosFn;
    
    self.currentPosition = {
        lat: self.profile.latitude,
        lng: self.profile.longitude,
        zoom: 14
    };

    function updateMarkerPosFn(position) {
        self.createdPosition = position;
    };

    function updateInfo(data) {
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

app.controller('PanelDialogCtrl', PanelDialogCtrl);


app.controller('storePageCtrl', function ($rootScope, apiStores, $stateParams) {
    self = this;

    self.store = apiStores.get({id: $stateParams.id}, function () {
        if (self.store !== undefined) {
            createMarker();
        }
    });
    self.store.id = $stateParams.id;

    $rootScope.currentStoreId = $stateParams.id;

    angular.extend(self, {
        currentStore: {
            lat: 49.9,
            lng: 8.660232,
            zoom: 12
        },
        markers: {
            m1: {
                lat: 49.9,
                lng: 8.660232,
                message: "self.store.name"
            }
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

/******* Services ********/



app.factory('yActiveGroup', function (apiGroups) {
    var activeGroup = {
        get: function () {
            return activeGroup.data;
        },
        data: undefined,
        id: undefined,
        set: function (group) {
            activeGroup.data = group;
            activeGroup.id = group.id;
        },
        setById: function (id) {
            activeGroup.id = id;
            activeGroup.data = apiGroups.get({id: id});
        }
    };
    return activeGroup;
});


app.service('yAuthService', function ($http) {
    var authService = {
        updateStatus: function () {
            authService.userData = $http.get('/api/auth/status').success(function (data) {
                if (data.display_name !== "") {
                    authService.userData = data;
                } else {
                    window.location.href = "/login/index.html";
                }
            });
            return authService.userData;
        },
        userData: null
    };
    return authService;
});

app.service('yAPI', function ($rootScope, apiGroups, apiStores, yActiveGroup, apiUsers, $filter) {
    var yAPIdata = {
        groups: null,
        stores: null,
        users: null,
        activeGroup: {
            getStores: function () {
                if (yActiveGroup.get() === undefined)
                    return;
                return $filter('filter')(yAPIdata.stores, {group: yActiveGroup.get().id}, true);
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
                        yActiveGroup.set(group);
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

function PanelDialogCtrl(mdPanelRef, yActiveGroup, $rootScope, yPostReq) {
    thisDialog = this;
    thisDialog._mdPanelRef = mdPanelRef;
    thisDialog.activeGroup = yActiveGroup.get();
    if (thisDialog.activeGroup !== undefined) {
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