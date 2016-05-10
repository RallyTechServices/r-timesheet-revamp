/*
 */
Ext.define('Rally.technicalservices.Logger',{
    
    saveForLater: false,
    logText: null,
    
    constructor: function(config){
        Ext.apply(this,config);
    },
    
    log: function(args){
        var timestamp = "[ " + Ext.util.Format.date(new Date(), "Y-m-d H:i:s.u") + " ]";
        //var output_args = arguments;
        //output_args.unshift( [ "[ " + timestamp + " ]" ] );
        //output_args = Ext.Array.push(output_args,arguments);
        
        var output_args = [];
        output_args = Ext.Array.push(output_args,[timestamp]);
        output_args = Ext.Array.push(output_args, Ext.Array.slice(arguments,0));

        if ( this.saveForLater ) {
            if ( !this.logText ) { 
                this.logText = "";
            } else {
                this.logText = this.logText + '<br/>';
            }
            
            this.logText = this.logText + output_args.join(' ');
            
                
        }
        window.console && console.log.apply(console,output_args);
    },
    
    getLogText: function() {
        return this.logText;
    }

});
