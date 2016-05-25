Ext.define('CA.technicalservices.TimeDetailsDialog', {
    extend: 'Rally.ui.dialog.Dialog',
    alias:'widget.tstimedetailsdialog',

    closable: true,

    layout: 'border',
    
    currentDay: null,
    
    timeBlocks: [],
    
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
        
        this.currentDay = new Date().getDay();
        
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
                item_id: 'day_box_' + day,
                xtype:'container',
                margin: 10,
                tpl: '<span class="day_name">{day}</span>: <span class="day_value">{value}</day>'
            });
            
            var value = me._getHoursForDay(day);
            me.day_boxes[day].update({day: day, value: value});
        });
    },
    
    _getHoursForDay: function(day_name) {
        var time_entry_value = this.row.getTimeEntryValue(day_name);
        var value = 0;
        
        if (! Ext.isEmpty(time_entry_value) ) {
            value = time_entry_value.get('Hours');
        }
        
        return value;
    },
    
    _buildForm: function() {
        var me = this,
            container = this.down('#dayContainer');
        
        this._buildNavigation(container);
        container.add({
            xtype:'container',
            itemId: 'detailsPanel',
            layout: 'vbox',
            width: '100%',
            height: 275,
            padding: 3
        });
        this._updateDetailsPanel();
        this._addAddButton(container);
        
    },
        
    _buildNavigation: function(container) {
        var me = this;
        
        var selector_box = container.add({
            xtype:'container',
            layout:'hbox'
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
        this._updateDetailsPanel();
    },
    
    _moveRight: function() {
        this.currentDay = this.currentDay + 1;
        if ( this.currentDay > 6 ) {
            this.currentDay = 0;
        }
        this.down('#day_selector_display').update({ day: CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay] });
        this._updateDetailsPanel();
    },
    
    _updateDetailsPanel: function() {
        var me = this,
            container = this.down('#detailsPanel');
        container.removeAll();
        
        var today_details = this.row.getTimeBlocks(CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay]);
        console.log('--details:', today_details, this.row);

        container.add({
            xtype:'container',
            itemId: 'time_block_container',
            flex: 1,
            layout: 'vbox'
        });
                
        this.timeBlocks = [];

        if ( !Ext.isEmpty(today_details)) {
            Ext.Array.each(today_details, function(detail){
                console.log('detail:', detail);
                this._addTimeBlock(detail);
            },this);
        }

        var current_total = this._getHoursForDay(CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay]);
        
        console.log('current total:', current_total);
        
        var adjustment = current_total - this._getTotal();
        if ( adjustment < 0 ) {
            adjustment = 0;
        }
        
        this._addDailyAdjustmentBox(container, adjustment);
        this._enableDisableAddButton();
    },
    
    _addAddButton: function(container){
        var button_container = container.add({
            xtype: 'container',
            layout: 'hbox',
            width: '100%',
            padding: 10
        });
        
        button_container.add({xtype:'container',flex: 1});
        
        button_container.add({
            xtype:'rallybutton',
            itemId: 'add_block_button',
            cls: 'small secondary',
            text: '+',
            listeners: {
                scope: this,
                click: function(button) {
                    this._addTimeBlock();
                }
            }
        });
    },
    
    _addDailyAdjustmentBox: function(container, adjustment){
        var adjustment_container = container.add({
            xtype: 'container',
            layout: 'hbox',
            width: '100%',
            margin: 7
        });
        
        adjustment_container.add({xtype:'container',flex: 1});
        
        var field = adjustment_container.add({
            itemId: 'adjustment_box',
            xtype:'rallynumberfield',
            value: adjustment,
            labelWidth: 75,
            width: 130,
            fieldLabel: 'Adjustment:',
            maxValue: 24,
            minValue: 0
        });
        
        field.on('change',this._recalculateTotal, this);
        
    },
    
    _removeTimeBlock: function(block,fields) {
        console.log('remove', block);

        Ext.Array.each(fields.reverse(), function(field){
            field.setValue(0);
        });
        
        this.row.removeTimeBlock(CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay], block.itemId);
        block.destroy();
        
        this._enableDisableAddButton();
    },
    
    _addTimeBlock: function(detail) {
        var container = this.down('#time_block_container');
        
        var item_id = new Date().getTime();
        if ( !Ext.isEmpty(detail) ) { item_id = detail.id; }
        
        var block = container.add({
            xtype: 'container',
            layout: 'hbox',
            itemId: item_id,
            defaults: { margin: 3 }
        });
        
        var hours = [
            {"display":"12A", "value":0},
            {"display":"1 A", "value":1},
            {"display":"2 A", "value":2},
            {"display":"3 A", "value":3},
            {"display":"4 A", "value":4},
            {"display":"5 A", "value":5},
            {"display":"6 A", "value":6},
            {"display":"7 A", "value":7},
            {"display":"8 A", "value":8},
            {"display":"9 A", "value":9},
            {"display":"10A", "value":10},
            {"display":"11A", "value":11},
            {"display":"12A", "value":12},
            {"display":"1 P", "value":13},
            {"display":"2 P", "value":14},
            {"display":"3 P", "value":15},
            {"display":"4 P", "value":16},
            {"display":"5 P", "value":17},
            {"display":"6 P", "value":18},
            {"display":"7 P", "value":19},
            {"display":"8 P", "value":20},
            {"display":"9 P", "value":21},
            {"display":"10P", "value":22},
            {"display":"11P", "value":23}
        ];
       
        var hour_store_start = Ext.create('Rally.data.custom.Store', {
            fields: ['display', 'value'],
            data : Ext.clone(hours)
        });
               
        var hour_store_end = Ext.create('Rally.data.custom.Store', {
            fields: ['display', 'value'],
            data : Ext.clone(hours)
        });
        
        var now = new Date();
        var hour_field_start = {
            xtype: 'rallycombobox',
            itemId: 'start_hour',
            fieldLabel: ' ',
            allowNoEntry: false,
            store: hour_store_start,
            queryMode: 'local',
            displayField: 'display',
            valueField: 'value',
            width: 95,
            labelWidth: 30,
            value: now.getHours()
        };
        
        var minute_field_start = {
            xtype:'rallynumberfield',
            itemId: 'start_minute',
            fieldLabel: '  ',
            maxValue: 59,
            minValue: 0,
//            spinDownEnabled: false,
//            spinUpEnabled: false,
            width: 55,
            labelWidth: 5,
            value: now.getMinutes()
        };
        
        var hour_field_end =  {
            xtype: 'rallycombobox',
            itemId: 'end_hour',
            allowNoEntry: true,
            noEntryText: ' ',
            noEntryValue: null,
            fieldLabel: 'to',
            store: hour_store_end,
            queryMode: 'local',
            displayField: 'display',
            valueField: 'value',
            width: 85,
            labelWidth: 20
        };
        
        var minute_field_end = {
            xtype:'rallynumberfield',
            itemId: 'end_minute',
            fieldLabel: '  ',
            maxValue: 59,
            minValue: 0,
//            spinDownEnabled: false,
//            spinUpEnabled: false,
            width: 55,
            labelWidth: 5
        };
        
        var total_field = {
            xtype:'rallynumberfield',
            itemId: 'block_total',
            fieldLabel: ' = ',
            labelSeparator: '',
            editable: false,
            maxValue: 24,
            minValue: 0,
            spinDownEnabled: false,
            spinUpEnabled: false,
            width: 65,
            labelWidth: 5
        };
        
        hour_field_start.value = new Date().getHours();
        minute_field_start.value = new Date().getMinutes();
        
        if ( !Ext.isEmpty(detail) ) { 
            hour_field_start.value = detail.start_hour;
            minute_field_start.value = detail.start_minute;
            hour_field_end.value = detail.end_hour;
            minute_field_end.value = detail.end_minute;
        }
        
        var fields = [
            block.add(hour_field_start),
            block.add(minute_field_start),
            block.add(hour_field_end),
            block.add(minute_field_end)
        ];
        
        block.add({xtype: 'container', flex: 1 });
        block.add(total_field);
        
        block.add({
            xtype:'rallybutton',
            itemId: 'remove_block_button',
            cls: 'no-border',
            text: '<span class="icon-cancel"> </span>',
            listeners: {
                scope: this,
                click: function(button) {
                    this._removeTimeBlock(block, fields);
                }
            }
        });
        
        Ext.Array.each(fields, function(field){
            field.on('change',function() { this._setValidBlockValues(block); }, this);
            field.on('change',function() { this._updateRow(block); }, this);
            field.on('change',function() { this._updateBlockTotal(block); }, this);
            // only update row total after block changes (not when first launched)
            field.on('change',this._recalculateTotal, this);
            
        },this);
        
        this.timeBlocks.push(block);
        
        this._setValidBlockValues(block);
        this._updateRow(block);
        this._updateBlockTotal(block);
        
    },
    
    _setValidBlockValues: function(block) {
        var start_hour = block.down('#start_hour').getValue();
        var start_minute = block.down('#start_minute').getValue();
        var end_hour = block.down('#end_hour').getValue();
        var end_minute = block.down('#end_minute').getValue();
        
        if ( Ext.isEmpty(start_hour) ) { return; }

        var end_store = block.down('#end_hour').getStore();
        end_store.clearFilter(true);
        end_store.addFilter({property:'value',operator:'>=',value:start_hour});
        
        if ( Ext.isEmpty(end_hour) ) { return; }
        
        if ( start_hour > end_hour ) {
            block.down('#end_hour').setValue('');
        }

    },
    
    _updateBlockTotal: function(block) {
        var start_hour = block.down('#start_hour').getValue();
        var start_minute = block.down('#start_minute').getValue();
        var end_hour = block.down('#end_hour').getValue();
        var end_minute = block.down('#end_minute').getValue();
        
        block.down('#block_total').setValue(0);
        
        var total = 0;
        
        if ( !Ext.isEmpty(start_hour) && !Ext.isEmpty(end_hour) ) { 
        
            var start = new Date(1999,1,1,start_hour,start_minute || 0);
            var end = new Date(1999,1,1,end_hour,end_minute || 0); 
            
            var total = Rally.util.DateTime.getDifference(end,start,'minute') / 60;
        }
        
        block.down('#block_total').setValue(total);
        this._enableDisableAddButton();
    },
    
    _updateRow: function(block) {
        
        this.row.addTimeBlock(CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay],{
            id: block.getItemId(),
            start_hour: block.down('#start_hour').getValue(),
            start_minute: block.down('#start_minute').getValue(),
            end_hour: block.down('#end_hour').getValue(),
            end_minute: block.down('#end_minute').getValue()
        });
        
        this.row.save();
        
    },
    
    _enableDisableAddButton: function() {
        if ( !this.down('#add_block_button') ) {
            return;
        }
        
        var disabled = false;
        Ext.Array.each(this.timeBlocks, function(block){
            if ( ! block.down("#block_total") ) {
                return;
            }
            
            var total = block.down('#block_total').getValue() || 0;

            if ( total <= 0 ) {
                disabled = true;
            }
        });
        
        this.down('#add_block_button').setDisabled(disabled);
    },
    
    _getTotal: function() {
        var total = 0;
       
        Ext.Array.each(this.timeBlocks, function(block){
            if ( !Ext.isEmpty(block) ) {
                var value = ( block.down('#block_total') && block.down('#block_total').getValue()) || 0;
                total += value;
            }
        });
        
        var adjustment_box = this.down('#adjustment_box');
        if ( !Ext.isEmpty(adjustment_box) ) {
            var adjustment = adjustment_box.getValue() || 0;
            total = total + adjustment;
        }
        
        return total;
    },
    
    _recalculateTotal: function() {        
        var total = Ext.util.Format.number(this._getTotal(),'#.##');
        console.log('_recalculateTotal', CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay], total);
        
        var day = CA.techservices.timesheet.TimeRowUtils.daysInOrder[this.currentDay];
        
        this.day_boxes[day].update({day: day, value: total});
        
        this.row.set(day, parseFloat(total,10));
        this.row.save();
    }
});
    
    