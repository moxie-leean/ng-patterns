angular
  .module('lnPatterns')
  .directive('lnOFlexibleContent', lnOFlexibleContent);

lnOFlexibleContent.$inject = ['$compile', '$injector', '$sanitize', '$document'];

function lnOFlexibleContent($compile, $injector, $sanitize, $document) {
  return {
    restrict: 'A',
    link: link,
    scope: {
      lnRows: '<'
    }
  };

  function link(scope, elem, attrs) {
    if (!scope.lnRows) {
      return;
    }

    elem.empty();

    angular.forEach(scope.lnRows, function( row ) {
      var directiveSuffix = normalize( row.acf_fc_layout );

      var mxDirectiveProvider = 'mxO' + capitalize( attrs.$normalize(directiveSuffix) ) + 'Directive';

      var prefix = $injector.has( mxDirectiveProvider ) ? 'mx-' : 'ln-';

      var directiveName = prefix + 'o-' + directiveSuffix;

      var rowDirective = '<section class="' + directiveName + '" ' + directiveName;

      for (var key in row) {
        if ( row.hasOwnProperty( key ) ) {
          var parAttr = normalize( key );

          if (parAttr.indexOf( prefix ) !== 0) {
            parAttr = prefix + parAttr;
          }


          var value = '';
          if ( angular.isObject(row[key]) ) {
            var div = $document[0].createElement('div');
            div.appendChild( $document[0].createTextNode( angular.toJson(row[key])) );
            value = $sanitize( div.innerHTML );
          } else {
            value = row[key].toString().replace(/"/g, '\'');
          }

          rowDirective += ' ' + parAttr + '="' + value + '"';
        }
      }

      rowDirective += '></section>';

      elem.append(rowDirective);
    });

    $compile(elem.contents())(scope);

    function capitalize( string ) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function normalize( string ) {
      return string.replace(/_/g, '-').toLowerCase();
    }
  }
}
