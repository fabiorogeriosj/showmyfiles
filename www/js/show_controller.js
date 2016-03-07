angular.module('showMyFile', ['treeControl'])
  .controller('showController', function($scope, $http) {
    
    $scope.socket = io.connect();
    $scope.nodeOpen = {};
    $scope.loadingFiles=false;
    $scope.zoomSelected=0;
    $scope.typeFile = 'code';
    $scope.fileShow = {};
    $scope.hidden = false;
    $scope.codeMode = [];
    $scope.dataForTheTree = [];
    $scope.thereIsFilesDownload = false;

    $scope.socket.on('filechangedownload', function (res){
        $scope.loadFilesDownload();
    });

    $scope.hiddenButton = function (){
      $scope.hidden = !$scope.hidden;
    }
    $scope.showScreenClick = function (){
        $scope.hidden = true;
        $scope.showScreen();
    }
    $scope.showScreen = function(){
      $scope.socket.on('showscreen', function(){
        console.log("gerou...");
        $scope.typeFile = 'screen';
        $scope.$apply();
        var imageUrl = 'images/screen.png';
        $scope.decachedImageUrl = imageUrl + '?decache=' + Math.random();
      });
    }

    $scope.loadFilesDownload = function(){
      $http.post('/getfilesdownload', {}).
        then(function(response) {
          $scope.filesDownloads = response.data;
          if($scope.filesDownloads.children.length){
            $scope.thereIsFilesDownload = true;
          } else {
            $scope.thereIsFilesDownload = false;
          }
        }, function(response) {
          console.log("error: ", response);
      });
    }

    $scope.loadFilesDownload();

    $scope.showSelectedToDownload = function(node){
      var win = window.open("/downloads/"+node.name, '_blank');
      win.focus();
    }

    $scope.showSelected = function(node){
      $scope.socket.removeAllListeners("showscreen");
      if(node.type=="file"){
        $scope.nodeOpen = node;
        node.loading=true;
        $http({
          method: 'POST',
          url: '/getfile',
          data: {file: node.path}
        })
        .success(function(res) {
          var ext = node.path.split('.').pop()+"".toLocaleLowerCase();
          if(ext=='png' || ext=='gif' || ext=='jpg' || ext=='jpeg'){
           $scope.typeFile = 'image';
           $scope.code = node.path;
          } else {
            if($scope.codeMode[ext]){
              $scope.modeView = $scope.codeMode[ext];
            } else {
              $scope.modeView = $scope.codeMode['js'];
            }
            $scope.typeFile = 'code';
            $scope.code = res;
          }
          node.loading=false;
        })
        .error(function(res){
          console.log("Error: ", res);
          $scope.code = "Não foi possível abrir arquivo!";
          node.loading=false;
        });
      }
    }


    
  });