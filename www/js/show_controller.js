angular.module('showMyFile', ['ui.codemirror','treeControl'])
  .controller('showController', function($scope, $http) {
    
    $scope.socket = io.connect();
    $scope.nodeOpen = {};
    $scope.loadingFiles=false;
    $scope.zoomSelected=0;
    $scope.typeFile = 'code';
    $scope.fileShow = {};
    $scope.codeMode = [];
    $scope.dataForTheTree = [];
    $scope.codeMode['js']="javascript";
    $scope.codeMode['css']="css";
    $scope.codeMode['html']="htmlmixed";
    $scope.codeMode['xml']="xml";
    $scope.modeView = $scope.codeMode['js'];
    $scope.thereIsFiles = false;
    $scope.thereIsFilesDownload = false;
    $scope.editorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        readOnly: true,
        mode: $scope.modeView,
        onLoad : function(_cm){
        $scope.modeChanged = function(){
          _cm.setOption("mode", $scope.modeView);
        };
      }
    };

    $scope.socket.on('filechange', function (res){
        if($scope.nodeOpen.path && res.filename == $scope.nodeOpen.path && $scope.typeFile != "screen"){
          $scope.showSelected($scope.nodeOpen);
        }
    });

    $scope.socket.on('filechangedownload', function (res){
        $scope.loadFilesDownload();
    });

    $scope.showScreen = function(){
      $scope.socket.on('showscreen', function(){
        console.log("gerou...");
        $scope.typeFile = 'screen';
        $scope.$apply();
        var imageUrl = 'images/screen.png';
        $scope.decachedImageUrl = imageUrl + '?decache=' + Math.random();
      });
    }

    $scope.loadFiles = function(){
      $scope.loadingFiles=true;
      $http.post('/getfiles', {}).
        then(function(response) {
          $scope.dataForTheTree = response.data;
          if($scope.dataForTheTree && $scope.dataForTheTree.children&& $scope.dataForTheTree.children.length){
            $scope.thereIsFiles = true;
          } else {
            $scope.thereIsFiles = false;
          }
          $scope.loadingFiles=false;
        }, function(response) {
          console.log("error: ", response);
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

    $scope.zoomIn = function(){
      if($scope.zoomSelected < 7){
        $scope.zoomSelected++;
      }
    }

    $scope.zoomOut = function(){
      if($scope.zoomSelected > -2){
        $scope.zoomSelected--;
      }
    }

    $scope.loadFiles();
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