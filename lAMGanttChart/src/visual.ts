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

        const topElement: HTMLElement = document.createElement("div");

        try{
          var v=options.dataViews[0].table.rows;
          var data:myDataType=[];

          var vT=v.length;
          console.log("Length:" + v[0].length)

          //#region COPY DATA TO data
          var lastRec:string="";
          for (let index = 0; index < vT; index++) {
              //const element = v[index];
              if (v[0].length<7)
              {
                this.target.innerHTML="Not enough fields to display data. Check properties (" + v[0].length.toString() + ")";
                  console.log("Length:" + v[0].length)
                  return;
              }

              //COLLAPSE TO ENGAGEMENTS ONLY
              if (lastRec!=v[index][1].toString() + v[index][2].toString() +v[index][3].toString())
              {
                lastRec=v[index][1].toString() + v[index][2].toString() +v[index][3].toString();
                if (v[index][4]!=null && v[index][5]!=null){
                  data.push({
                      PriorityIndex: +v[index][0],
                      Title: v[index][1],
                      State: v[index][2],
                      Owner: v[index][3],
                      EngagementStartDate: v[index][4],
                      EngagementEndDate: v[index][5],
                      Tags: v[index][6],
                      index:data.length
                  })
                }
              }
              v[index][12]=data.length-1;            
          }

          //console.log(data)
          //#endregion

          var bars="";

          //#region Define minDate and maxDate
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
                          +this.settings.dataPoint.INITIALDATE.substr(5,2)-1,
                          +this.settings.dataPoint.INITIALDATE.substr(8,2));
          }
          if (this.settings.dataPoint.FINALDATE!="")
          {
              if (this.settings.dataPoint.FINALDATE.length<10)
                  return;
              maxDate=new Date(+this.settings.dataPoint.FINALDATE.substr(0,4), 
                          +this.settings.dataPoint.FINALDATE.substr(5,2)-1,
                          +this.settings.dataPoint.FINALDATE.substr(8,2));
          }
          maxDate=new Date(maxDate.getFullYear(), maxDate.getMonth()+1,1);
          maxDate.setDate(maxDate.getDate()-1);

          minDate=new Date(minDate.getFullYear(),minDate.getMonth(),1);
          
          console.log(minDate + "\n" + maxDate)
          var diffDate=maxDate.valueOf()-minDate.valueOf();
          var diffDateDays=Math.ceil(diffDate/(1000 * 60 * 60 * 24));
          //#endregion
           
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
          const TAGCOLOR=this.settings.dataPoint.TAGCOLOR;
          const FONTYEAR=FONTMONTH+2;

          //#region Draw Header
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
          //#endregion
          
          if (this.settings.dataPoint.ORDERBYPI){
            //SORT DATA ON PI
            data.sort((a,b) => (
              a.PriorityIndex > b.PriorityIndex ? -1 : 0
              ));

          }
          else
          {
            //SORT DATA ON dateStart
            data.sort((a,b) => (
              a.dateStart > b.dateStart ? 1 : -1
              ));
          }
        
          //#region PROCESS ENGAGEMENTS
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
              element.y=-1;
            }
            else
            {
              if (x1<0){
                var x2= this.daysFromStart( endDate, minDate )/diffDateDays * divWidth-2;
                x1=0;
              }
          
              element.x1=x1;
              element.x2=x2;
          
              y=y+BARHEIGHT+BARPADDING;
              element.y=y;
            }
          }
          var yMax=y;
          //#endregion
            
          //#region DRAW BAR
          data.forEach(element => {
            var a:string=element.Title;
          
            if (element.y>0){
              var title=element.Title + "\n" 
                  + element.dateStart.toISOString().substr(0,10) 
                  + " to " 
                  + element.dateEnd.toISOString().substr(0,10) + "\n" 
                  + element.State + "\n" 
                  + element.Owner;
            //  PriorityIndex: +v[index][0],
            //  Tags: v[index][6],

              var x1=element.x1;
              var x2=element.x2;
              var y=element.y;
              var dummy;
              var t="";
              if (element.Tags!=null){
                console.log(element.Tags)
                dummy=element.Tags.split(";");
                dummy.forEach(element => {
                    if (element.trim().startsWith("#IS_"))
                    {
                          if (t!="") 
                              t+=", ";
                          t+=element.trim().substr(1).replace("&","&amp;");
                      }
                }); 
                console.log(t)
              }
              if (x1+x2>divWidth)
              {
                  x2=divWidth-x1;
              }
              bars+=`<div class=bar style='position:absolute;left:${x1+2}px;top:${y}px;height:${BARHEIGHT}px;width:${x2}px;font-size:${FONTTITLE}px;font-weight:bold;' title='${title}'>${a}</div>`;
              bars+=`<div style='color:blue;position:absolute;left:${x1+x2-150}px;top:${y+1}px;font-size:${FONTOWNER}px;text-align:right;width:150px;font-weight:bold'>${element.Owner}</div>`;
              bars+=`<div style='color:green;position:absolute;left:${x1+x2-100}px;top:${y-1+BARHEIGHT-12}px;font-size:${FONTOWNER}px;text-align:right;width:100px;height:${BARHEIGHT}px;'>${element.State}</div>`;

              bars+=`<div style='color:black;background-color:${TAGCOLOR};position:absolute;left:${x1+4}px;top:${y-1+BARHEIGHT-12}px;font-size:${FONTOWNER}px;text-align:left;'><b>${element.PriorityIndex}</b> | ${t}</div>`;
            }
          });
          //#endregion
            
          //EXTEND BACKDROP
          bars=bars.replace("###2000###",(yMax+30).toString());

          console.log(data)
          for (var index=0;index<vT;index++)
          {
            var sD=new Date(v[index][9].toString());
            var dd=this.daysFromStart( sD, minDate );

            var pos=+v[index][12];
            var dataPos=-1;
            for(var index2=0;index2<data.length;index2++)
            {
              if (data[index2].index==pos){
                dataPos=index2;
                break;
              }
            }

            if (dd>0 && dataPos!=-1 && data[dataPos].y!=-1){
              // console.log(v[index])
              // console.log("DRAW")
              // console.log(v[index])
              // console.log ("Date:" + sD + " ( days:" + dd + ")");
              // console.log("Engagement:" + dataPos)
  

              var x1= dd/diffDateDays * divWidth;

              var w=+v[index][10];
              w=Math.round(w*divWidth/diffDateDays);
              // console.log(w);
              
              
              //def color: (7)
              var color:string="gray";
              switch (v[index][7].toString().substr(0,3)) {
                case "Cod":
                    color="red";
                    break;
                case "Eng":
                    color="purple";
                    break;
                case "Tec":
                  color="orange";                  
                  break;
                case "Arc":
                  color="green";
                  break;
                default:
                  break;
              }
              // console.log(v[index][7].toString().substr(0,3) + "->" + color);

              var title=v[index][1] + "\n" + v[index][7] + "\n" + v[index][8] + "\n" + v[index][9] + "\n" + v[index][10];
  
              bars+=`<div style='opacity:0.3;background-color:${color};position:absolute;left:${x1}px;top:${data[dataPos].y}px;font-size:${FONTOWNER}px;text-align:left;height:${BARHEIGHT}px;width:${w}px;' title="${title}"></div>`;
            }

           }



            this.target.innerHTML="<div style='width:" + (divWidth+scrollBarWidth) + "px;height:" + divHeight + "px;overflow-y:scroll'>" 
            + "<div style=position:relative>"
            + bars 
                + "</div>"
                + "</div>";
        }
        catch(e)
        {
            this.target.innerHTML="<pre>" + JSON.stringify(e) + "</pre>";
            console.log(JSON.stringify(e));
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