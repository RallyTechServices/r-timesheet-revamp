Ext.define("TSTimesheet", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    layout: 'border',
    
    items: [
        {xtype:'container', itemId:'selector_box', region: 'north',  layout: { type:'hbox' }, minHeight: 25}
    ],

    integrationHeaders : {
        name : "TSTimesheet"
    },
                        
    launch: function() {
        this._addSelectors(this.down('#selector_box'));
    },
    _addSelectors: function(container) {
        container.removeAll();
        
        container.add({xtype:'container',flex: 1});
        
        container.add({
            xtype:'rallydatefield',
            itemId:'date_selector',
            fieldLabel: 'Week Starting',
            listeners: {
                scope: this,
                change: function(dp, new_value) {
                    var week_start = TSDateUtils.getBeginningOfWeekForLocalDate(new_value);
                    if ( week_start !== new_value ) {
                        dp.setValue(week_start);
                    }
                    if ( new_value.getDay() === 0 ) {
                        this.updateData();
                    }
                }
            }
        }).setValue(new Date());
    },
    
    updateData: function() {
        var me = this;
        var timetable  = this.down('tstimetable');
        if ( ! Ext.isEmpty(timetable) ) { timetable.destroy(); }
        
        this.startDate = this.down('#date_selector').getValue();
        
        var editable = true;
        
        this.time_table = this.add({ 
            xtype: 'tstimetable',
            region: 'center',
            layout: 'fit',
            margin: 15,
            startDate: this.startDate,
            editable: editable,
            listeners: {
                scope: this,
                gridReady: function() {
//                    this._addButtons(button_box);
//                    if ( editable ) {
//                        Ext.Array.each( this.query('rallybutton'), function(button) {
//                            button.setDisabled(false);
//                        });
//                    }
                }
            }
        });
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
