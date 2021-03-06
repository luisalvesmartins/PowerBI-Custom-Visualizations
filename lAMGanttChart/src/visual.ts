"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { Settings } from "./settings/settings";


export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: Settings;
    private host:IVisualHost;

     constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.target = options.element;
        this.host=options.host;
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

        const BACKGROUND_COLOR_ODD=this.settings.colorsSelection.BACKGROUND_COLOR_ODD;
        const BACKGROUND_COLOR_EVEN=this.settings.colorsSelection.BACKGROUND_COLOR_EVEN;
        const BORDER_COLOR=this.settings.colorsSelection.BORDER_COLOR;
        const TAGCOLOR=this.settings.colorsSelection.TAGCOLOR;

        const BARHEIGHT=this.settings.chartConfiguration.BARHEIGHT;
        const BARPADDING=this.settings.chartConfiguration.BARPADDING;
        const FONTOWNER=this.settings.fontSelection.FONTOWNER;
        const FONTMONTH=this.settings.fontSelection.FONTMONTH;
        const FONTTITLE=this.settings.fontSelection.FONTTITLE;
        const SHOWDETAIL=this.settings.chartConfiguration.SHOWDETAIL;
        const SHOWDETAILOVERLAP=this.settings.chartConfiguration.SHOWDETAILOVERLAP;

        const INITIALDATE=this.settings.chartConfiguration.INITIALDATE;
        const FINALDATE=this.settings.chartConfiguration.FINALDATE;

        const FONTYEAR=FONTMONTH+2;
        
        const PARTICIPATIONCOLUMN=13;

        // let selectionIdBuilder: SelectionIdBuilder = new SelectionIdBuilder(
        //   this.visualHost
        //   );

        try{
          var v=options.dataViews[0].table.rows;
          var data:myDataType=[];

          var vT=v.length;
          //console.log("Length:" + v[0].length)
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
                      index:data.length,
                      Link:v[index][11],
                      Participation:[],
                      maxParticipation:0,
                      Highlight:v[index][12]
                  })
                }
              }
              v[index][PARTICIPATIONCOLUMN]=data.length-1;
          }
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

          if (INITIALDATE!="")
          {
              if (INITIALDATE.length<10)
                  return;
              minDate=new Date(+INITIALDATE.substr(0,4), 
                          +INITIALDATE.substr(5,2)-1,
                          +INITIALDATE.substr(8,2));
          }
          if (FINALDATE!="")
          {
              if (FINALDATE.length<10)
                  return;
              maxDate=new Date(+FINALDATE.substr(0,4), 
                          +FINALDATE.substr(5,2)-1,
                          +FINALDATE.substr(8,2));
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
            

          //ADD PARTICIPATIONS TO THE DATA OBJECT
          for (let index = 0; index < vT; index++) {
            if (v[index][PARTICIPATIONCOLUMN]!=-1){

            var sD=new Date(v[index][9].toString());
            var dd=this.daysFromStart( sD, minDate );
            if (dd>0){
              var x1= dd/diffDateDays * divWidth;
              var w=Math.round(+v[index][10] *divWidth/diffDateDays);
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
              var title=v[index][1] + "\n" + v[index][7] + "\n" + v[index][8] + "\n" + v[index][9] + "\n" + v[index][10];

              const elem=data[+(v[index][PARTICIPATIONCOLUMN])];
              var foundRow=-1;
              for(var j=0;j<elem.Participation.length;j++){
                //console.log(elem.Participation[j].owner + "-" + v[index][8])
                if (elem.Participation[j].owner==v[index][8])
                {
                  foundRow=j;
                  break;
                }
              }
              //foundRow=-1;
              if (foundRow==-1){
                data[+v[index][PARTICIPATIONCOLUMN]].maxParticipation++;
              }

              elem.Participation.push({
                x:x1,
                w:w,
                title:title,
                owner:v[index][8],
                color:color,
                overlap:foundRow,
                Highlight:v[index][12]
              });
            }
          }
          }

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
              barY+="<div style='border-style:solid;1px;border-color:" + BORDER_COLOR + ";background-color:" + BACKGROUND_COLOR_EVEN + ";width:" + x1 + "px;text-align:center;'>" + iY + "</div>";
              iY++;
              ySP=new Date(iY,iM,1);
            }
            var x1= this.daysFromStart( new Date(iY,iM+1,0), sM )/diffDateDays * divWidth;
            barM+="<div style='border-style:solid;border-width:0 1px 0 1px;border-color:" + BORDER_COLOR + ";width:" + x1 + "px;background-color:" + backColor + ";text-align:center'>" + t + "</div>";
            barMD+="<div style='border:solid 1px " + BORDER_COLOR + ";height:" + "###2000###" + "px;width:" + x1 + "px;background-color:" + backColor + "'></div>";
            if (backColor==BACKGROUND_COLOR_ODD)
              backColor=BACKGROUND_COLOR_EVEN;
            else
              backColor=BACKGROUND_COLOR_ODD;
          }
          var x1= this.daysFromStart( new Date(iY,iM,1), ySP )/diffDateDays * divWidth;
          
          barY+="<div style='border-style:solid;1px;border-color:" + BORDER_COLOR + ";background-color:" + BACKGROUND_COLOR_EVEN + ";width:" + x1 + "px;text-align:center;'>" + iY + "</div>";
          
          bars+="<div style='display:flex;width:" + divWidth + "px;font-size:" + FONTYEAR + "px;'>" + barY + "</div>";
          bars+="<div style='display:flex;width:" + divWidth + "px;font-size:" + FONTMONTH + "px;'>" + barM + "</div>";
          bars+="<div style='display:flex;width:" + divWidth + "px;font-size:" + FONTMONTH + "px;'>" + barMD + "</div>";
          //#endregion
          
          //#region Order Data Object
          if (this.settings.chartConfiguration.ORDERBYPI){
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
          //#endregion
        
          //#region PROCESS ENGAGEMENTS

          var y=40+BARPADDING;
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
              var p=0;
              if (SHOWDETAIL)
                p=element.maxParticipation*15;
          
              element.y=y;
              y=y+BARHEIGHT+BARPADDING+p;
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

              var x1=element.x1;
              var x2=element.x2;
              var y=element.y;
              var dummy;
              var t="";
              if (element.Tags!=null){
                dummy=element.Tags.split(";");
                dummy.forEach(element => {
                    if (element.trim().startsWith("#IS_"))
                    {
                      if (t!="") 
                          t+=", ";
                      t+=element.trim().substr(1).replace("&","&amp;");
                    }
                }); 
              }
              if (x1+x2>divWidth)
              {
                  x2=divWidth-x1;
              }

              bars+=`<div class=bar style='position:absolute;left:${x1+2}px;top:${y}px;height:${BARHEIGHT}px;width:${x2}px;font-size:${FONTTITLE}px;' title='${title}'>`;
              bars+=`<div class=innerbar style="font-size:${FONTOWNER}px;">`;
             
              if (element.Link!=null)
                bars+=`<b><a href='${element.Link}' target='LINK'>${a}</a></b>`;
              else
                bars+=`<b>${a}</b>`;
              bars+=`<div class=topright>${element.Owner}</div>`;
              bars+=`<div class=bottomright>${element.State}</div>`;

              bars+=`<div class=bottomleft style='background-color:${TAGCOLOR};'><b>${element.PriorityIndex}</b> | ${t}</div>`;
              bars+=`</div>`;
              bars+=`</div>`;
            }
          });
          //#endregion
            
          //EXTEND BACKDROP
          bars=bars.replace("###2000###",(yMax+30).toString());

          //console.log(data)
          for (var index=0;index<data.length;index++)
          {
            var Parts=data[index].Participation;
            // if (data[index].maxParticipation>1)
            // {
              if (data[index].y!=-1){
                var yPos=0;
                for (var i=0;i<Parts.length;i++){
                  x1=Parts[i].x;
                  w=Parts[i].w;
                  title=Parts[i].title;
                  color=Parts[i].color;
                  //MAIN BAR
                  if (x1<divWidth){
                    if (x1+w>divWidth)
                    {
                        w=divWidth-x1;
                    }
                    if (SHOWDETAILOVERLAP)      
                      bars+=`<div class=partic style='background-color:${color};left:${x1}px;top:${data[index].y}px;font-size:${FONTOWNER}px;height:${BARHEIGHT}px;width:${w}px;' title="${title}"></div>`;
                  }
                  //Parts[i].owner
                  var pp:string= Parts[i].owner;
  
                  if (SHOWDETAIL){

                  var iPos=i;
                  if (Parts[i].overlap!=-1)
                    iPos=Parts[i].overlap;
                  else
                    iPos=yPos;
                  
                  var yy=data[index].y+BARHEIGHT+iPos*15;
                  //BACKGROUND BAR
                  if (Parts[i].overlap==-1){
                    var mx2=data[index].x2;
                    if (data[index].x1+mx2>divWidth)
                    {
                        mx2=divWidth-data[index].x1;
                    }
                    Parts[i].y=data[index].y+BARHEIGHT+(yPos*15);
                    if (Parts[i].Highlight=="Yes")
                      bars+=`<div class=bar style='background-color:#f2f2f2;color:black;position:absolute;left:${data[index].x1+2}px;top:${data[index].y+BARHEIGHT+(yPos*15)}px;height:15px;width:${mx2}px;font-size:${FONTTITLE}px;font-weight:bold;text-align:right;'>${pp}</div>`;
                    else
                      bars+=`<div class=bar style='background-color:#efefef;color:gray;position:absolute;left:${data[index].x1+2}px;top:${data[index].y+BARHEIGHT+(yPos*15)}px;height:15px;width:${mx2}px;font-size:${FONTTITLE}px;text-align:right;'>${pp}</div>`;
                    yPos++;
                  }
                  else
                  {
                    yy=Parts[Parts[i].overlap].y
                  }

                    
                  if (x1<divWidth){
                    //bars+=`<div class=partic style='background-color:"white";left:${data[index].x}px;top:${data[index].y+i*15}px;font-size:${FONTOWNER}px;height:15px;width:${data[index].w}px;' title="${title}">${pp}</div>`;
                    bars+=`<div class=partic style='background-color:${color};left:${x1}px;top:${yy}px;font-size:${FONTOWNER}px;height:15px;width:${w}px;' title="${title}"></div>`;

                  }
                }
              }
              }
  
            // }
           }

          var divElem=this.createDivElement({
            "width": (divWidth+scrollBarWidth) + "px",
            "height":divHeight + "px",
            "style":"overflow-y:scroll;overflow-x:hidden;height:" + divHeight + "px"
          })

          var divElemInner=this.createDivElement({
            "style":"position:relative" 
          })

           divElemInner.innerHTML=bars;
           divElem.appendChild(divElemInner);

           this.target.innerHTML=divElem.outerHTML;
        }
        catch(e)
        {
          console.log(e)
            this.target.innerHTML="ERROR:";
            this.target.innerHTML+=e.description + "<br>" + e.message;
            console.log(JSON.stringify(e));
        }

        this.target.addEventListener('click',()=>{
          var se=window.event.srcElement;
          if (se["href"])
            this.host.launchUrl(se["href"])
        });
       
    }

    private createDivElement(attribs){
      var divElem=document.createElement("div");
      for (let key in attribs) {
        divElem.setAttribute(key,attribs[key]);
      };

      return divElem;
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

    private static parseSettings(dataView: DataView): Settings {
        return <Settings>Settings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return Settings.enumerateObjectInstances(this.settings || Settings.getDefault(), options);
    }
}