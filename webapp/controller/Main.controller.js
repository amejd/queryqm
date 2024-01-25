sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    'sap/ui/export/Spreadsheet',
    'sap/ui/export/library',
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter, FilterOperator, DateFormat, Spreadsheet, exportLibrary) {
        "use strict";
        const EdmType = exportLibrary.EdmType;
        return Controller.extend("zqm.controller.Main", {
            onInit: function () {
                const oSmartTableFilter = this.getView().byId("smartFilterBar");
                const that = this
                oSmartTableFilter.attachSearch(function () {
                    var oDialog = that.getView().byId("BusyDialog");
                    oDialog.open();
                    // Get the values
                    const sLifnr = oSmartTableFilter.getFilterData().Lifnr;
                    const sClass = oSmartTableFilter.getFilterData().class;
                    // const sKlart = oSmartTableFilter.getFilterData().klart;

                    // Prepare the filters
                    let Filters = new Array();

                    sLifnr && Filters.push(
                        that._onGetFilters(sLifnr, "Lifnr")
                    )
                    sClass && Filters.push(
                        that._onGetFilters(sClass, "class")
                    )
                    // sKlart && Filters.push(
                    //     that._onGetFilters(sKlart, "klart")
                    // )

                    // 
                    // READ DATA FROM THE SERVICE
                    const oModel = that.getOwnerComponent().getModel()
                    oModel.read('/ZC_QueryVendor', {
                        filters: Filters,
                        success: function (oData) {
                            if (oData) {
                                // debugger
                                const jModel = new sap.ui.model.json.JSONModel(oData.results);
                                console.log(oData.results);
                                that.getView().byId('title').setText(`Fournisseurs (${oData.results.length})`)

                                // Sorting
                                oData.results.sort((a, b) => {
                                    const lifnrA = a.Lifnr;
                                    const lifnrB = b.Lifnr;

                                    if (lifnrA < lifnrB) {
                                        return -1;
                                    } else if (lifnrA > lifnrB) {
                                        return 1;
                                    } else {
                                        return 0;
                                    }
                                }); 
                                
                                that.getView().byId("table").setModel(jModel);
                                oDialog.close();
                            }
                        },
                        error: function (oError) {
                            alert('Error, try again !')
                        }
                    })

                }, { passive: true });
            },
            _onGetFilters: function (sFieldValue, sFieldName) {

                const oFilterEq = new Filter(sFieldName, FilterOperator.EQ, sFieldValue);
                return oFilterEq;

            },
            formatDate: function (oDate) {
                if (!oDate) {
                    return "";
                }

                var oDateFormat = DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" });
                return oDateFormat.format(new Date(oDate));
            },
            onExtractData: function(){
                const oTable = this.getView().byId('table')
                const oBinding = oTable.getBinding("rows")
                let aCols = [];
                oTable.getColumns().forEach(function (oColumn) {
                    const sLabel = oColumn.getLabel().getText();
                    const sPropertyName = oColumn.getTemplate().getBindingPath("text");
                    const sWidth = oColumn.getWidth();
                    // Assuming you have a formatter function for some columns
                    const oCol = {
                        label: sLabel,
                        property: sPropertyName,
                        type: EdmType.String, // Adjust this based on your data type
                        template: sPropertyName, // Use formatter if available
                        width: sWidth
                    };

                    aCols.push(oCol);
                });
                console.log(aCols);
                oBinding.oList.map((e)=>{
                    e.Aedat = this.formatDate(e.Aedat)
                    e.Erdat = this.formatDate(e.Erdat)
                    return e;
                })
               
                let oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oBinding,
                    fileName: `Liste-fournisseur_${this.formatDate(new Date())}.xlsx`,
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };

                let oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            },
            onClearAllFilters: function () {
                // Get the table
                const oTable = this.byId("table");
                const oListBinding = oTable.getBinding();
                // Clear selection
                oTable.clearSelection();
               
                if (oListBinding) {
                    oListBinding.aSorters = null;
                    oListBinding.aFilters = null;
                }

                for (let iColCounter = 0; iColCounter < oTable.getColumns().length; iColCounter++) {
                    oTable.getColumns()[iColCounter].setSorted(false);
                    oTable.getColumns()[iColCounter].setFilterValue("");
                    oTable.getColumns()[iColCounter].setFiltered(false);
                }

                // Update Binding
                // Remove any filters
                oListBinding.filter([]);
            }
        });
    });
