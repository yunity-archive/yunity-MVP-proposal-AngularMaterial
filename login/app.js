var app = angular.module('yunityWebApp', ['ngRoute', 'ngMaterial', 'ngResource', 'ngCookies', 'leaflet-directive']);


/**
 * Configure the Routes
 */
app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider
                .when("/", {templateUrl: "login.html", controller: "AppCtrl"})
                .when("/signUp", {templateUrl: "signUp.html", controller: "AppCtrl"})
    }]);


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
            .primaryPalette('yuniyColors', {
                'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
                'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
                'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
            });
});

/************ Factories ***********/

app.factory("apiUsers", function ($resource) {
    return $resource("/api/groups/:id");
});

/************** Controller ***************/
app.controller('AppCtrl', function ($http, $cookies) {
    
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.get('csrftoken');
    
    // Update Login Status
    $http.get('/api/auth/status').
            success(function (data) {
                if (data.display_name != "") {
                    window.location.href = "../index.html";
                }
            });
});

app.controller('LoginCtrl', function ($http) {
    var self = this;
    
    self.signup = function () {
        if (self.createdPosition !== undefined) {
            self.data.latitude = self.createdPosition.lat;
            self.data.longitude = self.createdPosition.lng;
        }
        $http.post('/api/users/', self.data).then(self.signupSuccess, self.loginError);
    };
    
    
    self.login = function () {
        $http.post('/api/auth/', self.data).then(self.loginSuccess, self.loginError);
    };

    self.loginSuccess = function () {
        window.location.href = "../index.html";
    };
    
    
    self.signupSuccess = function () {
        window.location.href = "index.html#";
    };
    
    self.loginError = function () {
        alert("error");
    };
    
    
    self.updateMarkerPosFn = function (position) {
        self.createdPosition = position;
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

/****************** Directives **********************/

app.directive("yMapPicker", function () {
    return {
        templateUrl: '../directives/yMapPicker/yMapPicker.html',
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
