Ext.define('CA.technicalservices.TimeDetailsDialog', {
    extend: 'Rally.ui.dialog.Dialog',
    alias:'widget.tstimedetailsdialog',

    closable: true,

    layout: 'border',
    
    currentDay: null,
    
    config: {
        /**
         * @cfg {String}
         * Title to give to the dialog
         */
        title: 'Time Details',
        
        row: null, // a time sheet row,
        
        autoShow: true,
        
        height: 400,
        width: 600

    },

    items: [{
        xtype: 'container',
        layout: 'hbox',
        items: [
            {
                xtype: 'container',
                itemId: 'daysContainer',
                layout: 'vbox',
                width: 150
            },
            {
                xtype: 'container',
                itemId: 'dayContainer',
//                border: 1,
//                style: {borderColor:'#f00', borderStyle:'solid', borderWidth:'1px'},
                width: 450
            }
        ]
    }],

    constructor: function(config) {
        this.mergeConfig(config);

        this.callParent([this.config]);
    },

    initComponent: function() {
        this.callParent(arguments);
        
        this.currentDay = CA.techservices.timesheet.TimeRowUtils.getDayOfWeekFromDate(new Date());
        
        this._buildDays();
        this._buildForm();
    },
    
    _buildDays: function() {
        var me = this,
            days = CA.techservices.timesheet.TimeRowUtils.daysInOrder;
            
        var container = this.down('#daysContainer');
        this.day_boxes = {};
        
        Ext.Array.each(days, function(day){
            me.day_boxes[day] = container.add({
                xtype:'container',
                margin: 10,
                tpl: '<span class="day_name">{day}</span>: <span class="day_value">{value}</day>'
            });
            
            var time_entry_value = me.row.getTimeEntryValue(day);
            var value = 0;
            
            if (! Ext.isEmpty(time_entry_value) ) {
                value = time_entry_value.get('Hours');
            }
            me.day_boxes[day].update({day: day, value: value});
        });
    },
    
    _buildForm: function() {
        var me = this,
            container = this.down('#dayContainer');
        
        this._buildNavigation(container); 
    },
    
    _buildNavigation: function(container) {
        var me = this;
        
        var selector_box = container.add({
            xtype:'container',
            layout:'hbox'
        });
        
        var display_box = container.add({
            xtype:'container',
            layout:'vbox'
        });
        
        selector_box.add({
            xtype:'rallybutton',
            text:'<span class="icon-left"> </span>', 
            cls: 'secondary small',
            listeners: {
                scope: this,
                click: this._moveLeft
            }
        });
        
        selector_box.add({ xtype:'container', flex: 1 });
        
        selector_box.add({
            xtype:'container', 
            tpl: '{day}',
            itemId: 'day_selector_display'
        }).update({ day: CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay] });

        selector_box.add({ xtype:'container', flex: 1 });
        
        selector_box.add({
            xtype:'rallybutton',
            text:'<span class="icon-right"> </span>', 
            cls: 'secondary small',
            listeners: {
                scope: this,
                click: this._moveRight
            }
        });
        
    },
    
    _moveLeft: function() {
        this.currentDay = this.currentDay - 1;
        if ( this.currentDay < 0 ) {
            this.currentDay = 6;
        }
        this.down('#day_selector_display').update({ day: CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay] });
    },
    
    _moveRight: function() {
        this.currentDay = this.currentDay + 1;
        if ( this.currentDay > 6 ) {
            this.currentDay = 0;
        }
        this.down('#day_selector_display').update({ day: CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay] });
    }
});
    
    