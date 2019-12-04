"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";
export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.target = options.element;
    }
    
    public update(options: VisualUpdateOptions) {
        interface myDataType {
            x1?: number,
            y?: number,
            x2?:number,
            dateStart?:Date,
            dateEnd?:Date,
            [key: string]: any
        }

        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        console.log('Visual update', options);

        const topElement: HTMLElement = document.createElement("div");

        try{

        var v=options.dataViews[0].table.rows;
        // console.log(v);
        var data:myDataType=[];
        for (let index = 0; index < v.length; index++) {
            //const element = v[index];
            if (v[0].length!=7)
                {
                    console.log("Length:" + v[0].length)
                    return;
                }
            if (v[index][4]!=null && v[index][5]!=null){
                data.push({
                    PriorityIndex: +v[index][0],
                    Title: v[index][1],
                    State: v[index][2],
                    Owner: v[index][3],
                    EngagementStartDate: v[index][4],
                    EngagementEndDate: v[index][5],
                    Tags: v[index][6]
                })
            }
            
        }

        var bars="";
        var minDate=new Date(data[0].EngagementStartDate);
        var maxDate=new Date(data[0].EngagementEndDate);
        data.forEach(element => {
            var sd:Date=new Date(element.EngagementStartDate);
            var ed=new Date(element.EngagementEndDate);
            element.dateStart=sd;
            element.dateEnd=ed;
        
            if (ed>maxDate)
            maxDate=ed;
            if (sd<minDate)
            minDate=sd;
        });

        if (this.settings.dataPoint.INITIALDATE!="")
        {
            if (this.settings.dataPoint.INITIALDATE.length<10)
                return;
            minDate=new Date(+this.settings.dataPoint.INITIALDATE.substr(0,4), 
                        +this.settings.dataPoint.INITIALDATE.substr(5,2),
                        +this.settings.dataPoint.INITIALDATE.substr(8,2));
        }
        if (this.settings.dataPoint.FINALDATE!="")
        {
            if (this.settings.dataPoint.FINALDATE.length<10)
                return;
            maxDate=new Date(+this.settings.dataPoint.FINALDATE.substr(0,4), 
                        +this.settings.dataPoint.FINALDATE.substr(5,2),
                        +this.settings.dataPoint.FINALDATE.substr(8,2));
        }
        minDate=new Date(minDate.getFullYear(),minDate.getMonth(),1);
        
        console.log(minDate + "\n" + maxDate)
        var diffDate=maxDate.valueOf()-minDate.valueOf();
        var diffDateDays=Math.ceil(diffDate/(1000 * 60 * 60 * 24));
           
        const scrollBarWidth=25;
           var divWidth=options.viewport.width-scrollBarWidth;
           var divHeight=options.viewport.height;
            //STATUS & TAGS
           
           const BACKGROUND_COLOR_ODD=this.settings.dataPoint.BACKGROUND_COLOR_ODD;
           const BACKGROUND_COLOR_EVEN=this.settings.dataPoint.BACKGROUND_COLOR_EVEN;
           const BORDER_COLOR=this.settings.dataPoint.BORDER_COLOR;
           const BARHEIGHT=this.settings.dataPoint.BARHEIGHT;
           const BARPADDING=this.settings.dataPoint.BARPADDING;
           const FONTOWNER=this.settings.dataPoint.FONTOWNER;
           const FONTMONTH=this.settings.dataPoint.FONTMONTH;
           const FONTTITLE=this.settings.dataPoint.FONTTITLE;
           const FONTYEAR=FONTMONTH+2;
           
           //DRAW THE HEADER
           var start=minDate.getFullYear() + this.to2(minDate.getMonth());
           var end=maxDate.getFullYear() + this.to2(maxDate.getMonth());
           var iM=minDate.getMonth();
           var iY=minDate.getFullYear();

           //+="<div style='display:flex;width:" + divWidth + "px'>";
           const MonthNames=["JAN","FEB","MAR","APR", "MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
           var ySP=new Date(iY,iM,1);
           var barY="";
           var barM="";
           var barMD="";
           var backColor=BACKGROUND_COLOR_ODD;
           while (iY + "" + this.to2(iM)<=end)
           {
             var sM=new Date(iY,iM,0);
             var t=MonthNames[iM];
             iM++;
             if (iM>11){
               iM=0;
               var x1= this.daysFromStart( new Date(iY+1,0,1), ySP )/diffDateDays * divWidth;
               barY+="<div style='border:solid 1px " + BORDER_COLOR + ";width:" + x1 + "px;text-align:center;'>" + iY + "</div>";
               iY++;
               ySP=new Date(iY,iM,1);
             }
             var x1= this.daysFromStart( new Date(iY,iM+1,0), sM )/diffDateDays * divWidth;
             barM+="<div style='border:solid 1px " + BORDER_COLOR + ";width:" + x1 + "px;background-color:" + backColor + ";text-align:center'>" + t + "</div>";
             barMD+="<div style='border:solid 1px " + BORDER_COLOR + ";height:" + "###2000###" + "px;width:" + x1 + "px;background-color:" + backColor + "'></div>";
             if (backColor==BACKGROUND_COLOR_ODD)
               backColor=BACKGROUND_COLOR_EVEN;
             else
               backColor=BACKGROUND_COLOR_ODD;
           }
           var x1= this.daysFromStart( new Date(iY,iM,1), ySP )/diffDateDays * divWidth;
           
           barY+="<div style='border:solid 1px " + BORDER_COLOR + ";width:" + x1 + "px;text-align:center;'>" + iY + "</div>";
           
           bars+="<div style='display:flex;width:" + divWidth + "px;font-size:" + FONTYEAR + "px;'>" + barY + "</div>";
           bars+="<div style='display:flex;width:" + divWidth + "px;font-size:" + FONTMONTH + "px;'>" + barM + "</div>";
           bars+="<div style='display:flex;width:" + divWidth + "px;font-size:" + FONTMONTH + "px;'>" + barMD + "</div>";
           
           data.sort((a,b) => (
               a.dateStart > b.dateStart ? 1 : -1
               ));
           
           var y=20;
           //FOR EACH BAR SET THE Y AND THE MAX Y
           for (let index = 0; index < data.length; index++) {
             const element = data[index];
             
             if (element.dateStart=="Invalid Date")
               element.dateStart=minDate;
             if (element.dateEnd=="Invalid Date")
               element.dateEnd=maxDate;
           
             var endDate=element.dateEnd;
             var startDate=element.dateStart;
             var x1= this.daysFromStart( startDate, minDate )/diffDateDays * divWidth;
             var x2= this.daysFromStart( endDate, startDate )/diffDateDays * divWidth;
           
             if (endDate<minDate || startDate>maxDate){
           //DONT DISPLAY
               data.y=-1;
             }
             else
             {
               if (x1<0){
                 var x2= this.daysFromStart( endDate, minDate )/diffDateDays * divWidth-2;
                 x1=0;
               }
           
               element.x1=x1;
               element.x2=x2;
           
               var bFound=false;
               for (let index2 = 0; index2 < index; index2++) {
                 const element2 = data[index2];
                 if (bFound){
                   //CHECK SAME Y
                   if (element.y==element2.y){
                     if (data[index2].x1+data[index2].x2>element.x1)
                       bFound=false;
                   }
                 }
                 if (data[index2].x1+data[index2].x2<element.x1)
                 {
                   bFound=true;
                   element.y=data[index2].y;
                 }
               }
           
               if (!bFound){
                 y=y+BARHEIGHT+BARPADDING;
                 element.y=y;
               }
             }
           }
           var yMax=y;
           
           data.forEach(element => {
             var a:string=element.Title;
           
             if (element.y>0){
               var title=startDate + "\n" + endDate;
               var x1=element.x1;
               var x2=element.x2;
               var y=element.y;
               var dummy;
               var t="";
               if (element.Tags!=null){
                dummy=element.Tags.split(";");
                dummy.forEach(element => {
                    if (element.startsWith("#IS_"))
                    {
                         if (t!="") 
                             t+=", ";
                         t+=element.substr(1);
                     }
                }); 
               }
               if (x1+x2>divWidth)
               {
                   x2=divWidth-x1;
               }
               bars+=`<div class=bar style='position:absolute;left:${x1+2}px;top:${y}px;height:${BARHEIGHT}px;width:${x2}px;font-size:${FONTTITLE}px;font-weight:bold;' title='${title}'>${a}</div>`;
               bars+=`<div style='color:blue;position:absolute;left:${x1+x2-100}px;top:${y+1}px;font-size:${FONTOWNER}px;text-align:right;width:100px;font-weight:bold'>${element.Owner}</div>`;
               bars+=`<div style='color:green;position:absolute;left:${x1+x2-100}px;top:${y-1+BARHEIGHT-12}px;font-size:${FONTOWNER}px;text-align:right;width:100px;height:${BARHEIGHT}px;'>${element.State}</div>`;

               bars+=`<div style='color:black;background-color:#bbbbbb;position:absolute;left:${x1+2}px;top:${y-1+BARHEIGHT-12}px;font-size:${FONTOWNER}px;text-align:left;'>${t}</div>`;

            }
           });
           
           bars=bars.replace("###2000###",(yMax+30).toString());

        this.target.innerHTML="<div style='width:" + (divWidth+scrollBarWidth) + "px;height:" + divHeight + "px;overflow-y:scroll'>" 
        + "<div style=position:relative>"
        + bars 
            + "</div>"
            + "</div>";
    }
    catch(e)
    {
        this.target.innerHTML=e;
        console.log(e);
    }


    }

    private daysFromStart(date,initialDate){
        return Math.ceil((date-initialDate)/(1000 * 60 * 60 * 24))
    }
    private to2(n:number){
        if (n<10)
            return "0" + n;
        else
            return n.toString();
    }


    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}