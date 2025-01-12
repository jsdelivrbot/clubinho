angular.module('clubinho.directives', [])

.directive('clubinhoLoader', function() {
  return {
    restrict: 'A',
    scope: {
      show: '='
    },
    templateUrl: 'templates/directives/clubinho-loader.html'
  }
})

.directive('clubinhoChildrenList', function($ionicScrollDelegate, Children, Profile, $timeout, $rootScope, $cordovaNetwork, ionicToast) {
  return {
    restrict: 'A',
    scope: {
      children: '=list',
      addChild: '=',
      editChild: '=',
      deleteChild: '=',
      eventsToConfirm: '='
    },
    templateUrl: 'templates/directives/clubinho-children-list.html',
    link: function(scope, element, attr) {
      if (scope.eventsToConfirm) {
        var updateScope = function(notification) {
            var eventToConfirm = Profile.eventAvailableToConfirm(),
              event;

            if (scope.hasOwnProperty('children') && scope.children.length && eventToConfirm) {
              if (!('children' in eventToConfirm) && !children.length) {
                return;
              }
              
              scope.children.forEach(function(child) {
                var isToConfirm = false;

                eventToConfirm.children.forEach(function(c) {
                  if (c.id == child.id && !c.confirmed) {
                    isToConfirm = true;
                  }
                });

                if (isToConfirm) {
                  // open just the first child
                  child.open = !event;

                  if (!event) {
                    event = angular.copy(eventToConfirm);
                    event.children = [];
                  }

                  event.children.push(child);
                }

                child.eventToConfirm = isToConfirm ? eventToConfirm : null;
              });

              if (event && notification) {
                var message = templateEngine('Você já pode confirmar a presença de {{children}} no {{event}}.' , {
                  event: event.title,
                  children: event.children.map(function(child) {
                    return child.name;
                  }).join(', ')
                });

                ionicToast.show(message, 'top', true, 1);
              }
            }
          },
          confirm = function(confirm, child) {
            if (window.cordova && $cordovaNetwork.isOffline()) {
              ionicToast.show('Você está sem internet!', 'top', false, 2500);
              return;
            }

            if (confirm) {
              $rootScope.app.showLoading();

              Children
                .confirmPresence(confirm, child.eventToConfirm, child)
                .then(function(response) {
                  ionicToast.show('Pronto. Evento confirmado!', 'top', false, 2500);
                }, function(response) {
                  var error; 
                  
                  if (response.data.data && response.data.data.params) {
                    var errors = [];

                    for(var error in response.data.data.params) {
                      errors.push(response.data.data.params[error]);
                    };

                    error = errors.join(', ');
                  } else if(response.data.message) {
                    error = response.data.message;
                  } else {
                    error = 'Não foi possível confirmar a criança.';
                  }

                  ionicToast.show(error, 'top', false, 2500);
                })
                .finally(function() {
                  $rootScope.app.hideLoading();
                  Profile.removeEventToConfirm(child.eventToConfirm, child);
                  updateScope();
                });
            } else {
              Profile.removeEventToConfirm(child.eventToConfirm, child);
              updateScope();
            }
          },
          unwatch = scope.$watch('children', function(newValue, oldValue) {
            if (newValue === oldValue) {
              return;
            }

            updateScope();
            unwatch();
          }), 
          templateEngine = function(tpl, data) {
            var re = /{{([^}}]+)?}}/g, 
              match;

            while(match = re.exec(tpl)) {
              tpl = tpl.replace(match[0], data[match[1]])
            }
            
            return tpl;
          };

        scope.confirm = function(child) {
          confirm(true, child);
        }

        scope.decline = function(child) {
          confirm(false, child);
        }

        $rootScope.$on('clubinho-event-to-confirm', function() {
          updateScope(true);
        });

        updateScope();
      }

      scope.toggleChild = function(child, e) {
        var $this = $(e.target);
        
        $this = $this.is('li') ? $this : $this.closest('li');

        $this
          .toggleClass('open')
          .siblings('li').removeClass('open');

        $ionicScrollDelegate.resize();

        setTimeout(function() {
          $ionicScrollDelegate.resize();
        }, 500);
      };
    } 
  }
})

.directive('passwordVerify', function() {
  return {
    require: 'ngModel',
    scope: {
      passwordVerify: '='
    },
    link: function(scope, element, attrs, controller) {
      scope.$watch(function() {
        var combined;

        if (scope.passwordVerify || controller.$viewValue) {
          combined = scope.passwordVerify + '_' + controller.$viewValue; 
        }                    
        
        return combined;
      }, function(value) {
        if (value) {
          controller.$parsers.unshift(function(viewValue) {
            var origin = scope.passwordVerify;

            if (origin !== viewValue) {
              controller.$setValidity('passwordVerify', false);
              return undefined;
            } else {
              controller.$setValidity('passwordVerify', true);
              return viewValue;
            }
          });
        }
      });
     }
   };
});
