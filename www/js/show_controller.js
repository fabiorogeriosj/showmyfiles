angular.module('showMyFile', ['ui.codemirror','treeControl'])
  .controller('showController', function($scope, $http) {
    
    $scope.socket = io.connect();
    $scope.nodeOpen = {};
    $scope.loadingFiles=false;
    $scope.zoomSelected=0;
    $scope.typeFile = 'code';
    $scope.fileShow = {};
    $scope.codeMode = [];
    $scope.codeMode['js']="javascript";
    $scope.codeMode['css']="css";
    $scope.codeMode['html']="htmlmixed";
    $scope.codeMode['xml']="xml";
    $scope.modeView = $scope.codeMode['js'];
    $scope.editorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        readOnly: 'nocursor',
        mode: $scope.modeView,
        onLoad : function(_cm){
        $scope.modeChanged = function(){
          _cm.setOption("mode", $scope.modeView);
        };
      }
    };
    // The ui-codemirror option
    $scope.cmOption = {
      lineNumbers: true,
      indentWithTabs: true,
      
    };

    $scope.socket.on('filechange', function (res){
        if($scope.nodeOpen.path && res.filename == $scope.nodeOpen.path){
          $scope.showSelected($scope.nodeOpen);
        }
    });

    $scope.loadFiles = function(){
      $scope.loadingFiles=true;
      $http.post('/getfiles', {}).
        then(function(response) {
          console.log(response);
          $scope.dataForTheTree = response.data;
          $scope.loadingFiles=false;
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

    $scope.showSelected = function(node){
      if(node.type=="file"){
        $scope.nodeOpen = node;
        node.loading=true;
        $http({
          method: 'POST',
          url: '/getfile',
          data: {file: node.path}
        })
        .success(function(res) {
          console.log(res)
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