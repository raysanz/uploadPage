////defining the app
'use strict';
$(function () {
    angular.bootstrap(document, ['fileUploadApp']);
});
(function () {
    "use strict";

    angular.module("fileUploadApp", [

        // "angular-ui-router",
        "ui.router", "ui.bootstrap", "phoodieApp.main", "phoodieApp.services"]
        /// "phoodieApp.controller",


    ).config(RouteConfig).run(function ($rootScope, $document, $window) {

        $rootScope.$on('$stateChangeError', console.log.bind(console));
        $rootScope.$on("$stateChangeSuccess", function () {
            $document[0].body.scrollTop = $document[0].documentElement.scrollTop = 0;
        });
    });

    RouteConfig.$inject = ["$stateProvider", "$urlRouterProvider", "$locationProvider"];

    function RouteConfig($stateProvider, $urlRouterProvider, $locationProvider) {
        $urlRouterProvider.otherwise("/");
        $locationProvider.html5Mode(true);
    }
})();