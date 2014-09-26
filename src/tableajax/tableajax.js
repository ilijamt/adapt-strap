angular.module('adaptv.adaptStrap.tableajax', ['adaptv.adaptStrap.utils', 'adaptv.adaptStrap.loadingindicator'])
/**
 * Use this directive if you need to render a table that loads data from ajax.
 */
  .directive('adTableAjax',
  ['$parse', '$compile', '$templateCache', '$adConfig', 'adLoadPage', 'adDebounce', 'adStrapUtils',
    function ($parse, $compile, $templateCache, $adConfig, adLoadPage, adDebounce, adStrapUtils) {
      'use strict';
      function _link(scope, element, attrs) {
        // We do the name spacing so the if there are multiple ad-table-ajax on the scope,
        // they don't fight with each other.
        scope[attrs.tableName] = {
          items: {
            list: undefined,
            paging: {
              currentPage: 1,
              totalPages: undefined,
              pageSize: Number(attrs.pageSize) || 10,
              pageSizes: $parse(attrs.pageSizes)() || [10, 25, 50]
            }
          },
          localConfig: {
            pagingArray: [],
            loadingData: false,
            tableMaxHeight: attrs.tableMaxHeight
          },
          templateNoData: {
            url: undefined,
            template: undefined,
            message: 'No available data'
          },
          ajaxConfig: scope.$eval(attrs.ajaxConfig),
          applyFilter: adStrapUtils.applyFilter,
          readProperty: adStrapUtils.getObjectProperty
        };

        // extend the default data for templates
        angular.extend(scope[attrs.tableName].templateNoData, scope.$eval(attrs.templateNoData));

        // ---------- Local data ---------- //
        var tableModels = scope[attrs.tableName],
          mainTemplate = $templateCache.get('tableajax/tableajax.tpl.html'),
          lastRequestToken;

        if (tableModels.items.paging.pageSizes.indexOf(tableModels.items.paging.pageSize) < 0) {
          tableModels.items.paging.pageSize = tableModels.items.paging.pageSizes[0];
        }

        // ---------- ui handlers ---------- //
        tableModels.loadPage = adDebounce(function (page) {
          lastRequestToken = Math.random();
          tableModels.localConfig.loadingData = true;
          var pageLoader = scope.$eval(attrs.pageLoader) || adLoadPage,
            params = {
              pageNumber: page,
              pageSize: tableModels.items.paging.pageSize,
              sortKey: tableModels.localConfig.predicate,
              sortDirection: tableModels.localConfig.reverse,
              ajaxConfig: tableModels.ajaxConfig,
              token: lastRequestToken
            },
            successHandler = function (response) {
              if (response.token === lastRequestToken) {
                tableModels.items.list = response.items;
                tableModels.items.paging.totalPages = response.totalPages;
                tableModels.items.paging.currentPage = response.currentPage;
                tableModels.localConfig.pagingArray = response.pagingArray;
                tableModels.localConfig.loadingData = false;
              }
            },
            errorHandler = function () {
              tableModels.localConfig.loadingData = false;
            };

          pageLoader(params).then(successHandler, errorHandler);
        });

        tableModels.loadNextPage = function () {
          if (!tableModels.localConfig.loadingData) {
            if (tableModels.items.paging.currentPage + 1 <= tableModels.items.paging.totalPages) {
              tableModels.loadPage(tableModels.items.paging.currentPage + 1);
            }
          }
        };

        tableModels.loadPreviousPage = function () {
          if (!tableModels.localConfig.loadingData) {
            if (tableModels.items.paging.currentPage - 1 > 0) {
              tableModels.loadPage(tableModels.items.paging.currentPage - 1);
            }
          }
        };

        tableModels.loadLastPage = function () {
          if (!tableModels.localConfig.loadingData) {
            if (tableModels.items.paging.currentPage !== tableModels.items.paging.totalPages) {
              tableModels.loadPage(tableModels.items.paging.totalPages);
            }
          }
        };

        tableModels.pageSizeChanged = function (size) {
          if (Number(size) !== tableModels.items.paging.pageSize) {
            tableModels.items.paging.pageSize = Number(size);
            tableModels.loadPage(1);
          }
        };

        tableModels.sortByColumn = function (column) {
          if (column.sortKey) {
            if (column.sortKey !== tableModels.localConfig.predicate) {
              tableModels.localConfig.predicate = column.sortKey;
              tableModels.localConfig.reverse = true;
            } else {
              if (tableModels.localConfig.reverse === true) {
                tableModels.localConfig.reverse = false;
              } else {
                tableModels.localConfig.reverse = undefined;
                tableModels.localConfig.predicate = undefined;
              }
            }
            tableModels.loadPage(tableModels.items.paging.currentPage);
          }
        };

        // ---------- initialization and event listeners ---------- //
        //We do the compile after injecting the name spacing into the template.
        tableModels.loadPage(1);

        // reset on parameter change
        scope.$watch(attrs.ajaxConfig, function () {
          tableModels.loadPage(1);
        }, true);

        attrs.tableClasses = attrs.tableClasses || 'table';
        attrs.paginationBtnGroupClasses = attrs.paginationBtnGroupClasses || 'btn-group btn-group-sm';
        mainTemplate = mainTemplate.replace(/%=tableName%/g, attrs.tableName).
          replace(/%=columnDefinition%/g, attrs.columnDefinition).
          replace(/%=tableClasses%/g, attrs.tableClasses).
          replace(/%=paginationBtnGroupClasses%/g, attrs.paginationBtnGroupClasses).
          replace(/%=icon-firstPage%/g, $adConfig.iconClasses.firstPage).
          replace(/%=icon-previousPage%/g, $adConfig.iconClasses.previousPage).
          replace(/%=icon-nextPage%/g, $adConfig.iconClasses.nextPage).
          replace(/%=icon-lastPage%/g, $adConfig.iconClasses.lastPage).
          replace(/%=icon-sortAscending%/g, $adConfig.iconClasses.sortAscending).
          replace(/%=icon-sortDescending%/g, $adConfig.iconClasses.sortDescending).
          replace(/%=icon-sortable%/g, $adConfig.iconClasses.sortable)
        ;
        element.empty();
        element.append($compile(mainTemplate)(scope));
      }

      return {
        restrict: 'E',
        link: _link
      };
    }]);
