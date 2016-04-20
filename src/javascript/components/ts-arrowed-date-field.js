Ext.define('TSArrowedDate',{
    extend: 'Ext.container.Container',
    alias: 'widget.tsarroweddate',
    
    layout: 'hbox',
    
    items: [
        {xtype:'rallybutton',itemId:'previous_button',cls:'secondary', ui: 'tsnav', text: '<<'},
        {xtype:'rallydatefield',itemId:'date_field'},
        {xtype:'rallybutton',itemId:'next_button',cls:'secondary', ui: 'tsnav', text: ' >>'}
    ],
    
    constructor: function (config) {
        this.mergeConfig(config);
        
        this.callParent([this.config]);
    },
    
    initComponent: function() {
        var me = this;
        
        this.callParent(arguments);
        
        this.addEvents(
            /**
             * @event
             * Fires when the grid has been rendered
             * @param {TSArrowedDate} datefield
             * @param {date} new value
             * @param {date} old value
             */
            'change'
        );
        
        if ( this.value ) { this.down('rallydatefield').setValue(value); }
        
        this.down('rallydatefield').on('change', this._onDateChanged, this);
        this.down('#previous_button').on('click', this._onPreviousButtonClicked, this);
        this.down('#next_button').on('click', this._onNextButtonClicked, this);
    },
    
    _onDateChanged: function(picker,new_value,old_value) {
        this.fireEvent('change',this,new_value,old_value);
    },
    
    setValue: function(value) {
        this.down('rallydatefield').setValue(value);
    },
    
    getValue: function() {
        return this.down('rallydatefield').getValue();
    },
    
    _onPreviousButtonClicked: function() {
        var value = this.getValue();
        if ( Ext.isEmpty(value) ) { return; }
        
        this.setValue(Rally.util.DateTime.add(value,'day',-7));
    },
    
    _onNextButtonClicked: function() {
        var value = this.getValue();
        if ( Ext.isEmpty(value) ) { return; }
        
        this.setValue(Rally.util.DateTime.add(value,'day',7));
    }
    
});