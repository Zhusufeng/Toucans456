angular.module('app')
  .controller('TouristCtrl', ['$scope', 'get', '$state', function ($scope, get, $state) {
    this.loginClick = (username, password) => {
      var config = {
        params: { username: username, hash: password }
      }
      get.login(config, (token) => {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token.data;
        // Get User's Personal Hompage
        $state.go('primary');
      });
    };

    this.signUpClick = (username, password) => {
      var config = {username: username, hash: password};

      get.signUp (config, (token) => {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token.data;
        // Get User's Personal Hompage route to primary view
        $state.go('primary');
      });
    };

    this.logout = () => {
      console.log('LOGOUT SPARKLE UNICORN!');
      $state.go('tourist');
    };

  }])
  .component('tourist', {

    controller: 'TouristCtrl',
    templateUrl: 'client/components/tourist/tourist.html'

  });
