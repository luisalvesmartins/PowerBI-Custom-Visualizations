/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
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
        this.target = options.element;
    }

    private drawBox(text,ypos,xpos,o,width,highlight): HTMLElement {
        var color=this.settings.dataPoint.defaultColor;
        var colorNoteB=this.settings.dataPoint.fillOwner;
        var colorNoteF="Black";
        var fColor="white";
        var fontSizeOwner=this.settings.dataPoint.fontSizeOwner;
        var owner=o;

        var l:number=text.length;
        var showText:string=text;
        if (l>this.settings.dataPoint.limitLength)
            showText=showText.substr(0,this.settings.dataPoint.limitLength-3)+"...";
    
        var h=document.createElement("div");
        var style="position:absolute;left:" + xpos + "px;top:" + ypos + "px;" + 
            "width:" + width + "px;height:50px;" + 
            "font-size:" + this.settings.dataPoint.fontSize + "px;font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;";
        if (highlight==true)
            color=this.settings.dataPoint.highlightColor;
        h.innerHTML="<div style='" + style + "'>" +
            "<div style='padding:2px;color:" + fColor + ";background-color:" + color + ";' title='" + text + "\n" + o + "'>" + showText + "</div>" + 
            "<div style='padding:2px;color:" + colorNoteF + ";background-color:" + colorNoteB + ";font-size:" + fontSizeOwner + "px;'>" + owner + "</div></div>";
        return h;
    }

  

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);

        const topElement: HTMLElement = document.createElement("div");
        topElement.setAttribute("style","display:flex;justify-content:center;");

        const debug: HTMLElement = document.createElement("div");

        var debugText: string="";

        try{

            //GET SCALE
            var v=options.dataViews[0].table.rows;
            var vMax:number=11;
            var vMin:number=100;
            var arr=[];
            for (let index = 0; index < v.length; index++) {
                var element:number = +v[index][0];
                if (element>vMax)
                    vMax=element;
                if (element<vMin)
                    vMin=element;
                arr.push({
                    i:element, 
                    t:v[index][1],
                    bucket:v[index][2]+"",
                    o:v[index][3],
                    h:v[index][4]
                })
            }
            debugText+="<br>vMin:" + vMin + " vMax:" + vMax;
            if (vMax<vMin)
                { 
                    vMin=0;
                    vMax=25;
                }
            var d=(vMax-vMin)/10;
            vMax+=d;
            vMin-=d;
            arr.sort(function (a,b){
                if (a.bucket<b.bucket) 
                    return -1; 
                else 
                    if (a.bucket>b.bucket)
                        return 1;
                    else
                        if (a.i<b.i)
                            return -1;
                        else
                            return 1;
            });
            vMax=Math.round(vMax+0.5);
            vMin=Math.round(vMin);

            debugText+="<br>vMin:" + vMin + " vMax:" + vMax;

            var h=options.viewport.height-30;
            
            if (document) {
                const colWidth=this.settings.dataPoint.swimLaneWidth;
                var n:number=this.settings.dataPoint.numberOfColumns;
                if (n<1)
                    n=1;
                const step=colWidth/n;
                const boxWidth=step-2;
                var headerArray=this.settings.dataPoint.stageTitle.split("|");
                var stagesArray=this.settings.dataPoint.stageHead.split("|");
                var numberOfSections=headerArray.length;

                // DRAW AXIS
                const sectionAxis: HTMLElement = document.createElement("div");
                sectionAxis.setAttribute("style","position:relative;min-width: 30px;border:0;height:" + h + "px;");
                sectionAxis.innerHTML="<div style='position:absolute;right:0;margin:2px;font-size:10px;'>" + vMax + "</div>" + 
                        "<div style='position:absolute;top:50%;transform: rotate(270deg);transform-origin: 0 0;font-size:12px;left:10px'>Priority&nbsp;Index</div>" + 
                        "<div style='position:absolute;bottom:0;right:0;margin:2px;font-size:10px;'>" + vMin + "</div>";

                //SECTIONS
                var sections=[];
                var dummy=this.settings.dataPoint.stageColors.split('|');
                for (let index = 0; index < numberOfSections; index++) {
                    const section0: HTMLElement = document.createElement("div");
                    section0.setAttribute("style","position:relative;min-width:" + colWidth + "px;border:1px lightgray solid ;height:" + h + "px;background-color:" + dummy[index] + ";");
                    section0.innerHTML="<div style='min-width:" + colWidth + "px;text-align:center;font-weight:bold;'>" + headerArray[index] + "</div>";
                    sections.push(section0);
                }

                var xpos:number=2;
                var lastBucket:string="";
                for (let index = 0; index < arr.length; index++) {
                    var elem=arr[index];
                    var bucket:string = elem.bucket;

                    // Horizontal Position
                    xpos+=step;
                    if (xpos>colWidth-step+14)
                        xpos=2;
                    if (elem.bucket!=lastBucket){
                        lastBucket=elem.bucket;
                        xpos=2;
                    }

                    // Vertical Position
                    var y=Math.round(h-(elem.i-vMin)/(vMax-vMin)*h);

                    //DEBUG FIRST 3 ROWS
                    if (index<3)
                        debugText+="<br>t:" + elem.t + "," + y + "," + xpos + "," + elem.o + "," + elem.h;

                    var e=this.drawBox(elem.t, y,xpos, elem.o, boxWidth, elem.h);

                    // Appends to the correct column
                    for (let index = 0; index < numberOfSections; index++) {
                        if (bucket.startsWith(stagesArray[index]))
                        {
                            sections[index].appendChild(e);
                        }
                    }
                }
        
                topElement.appendChild(sectionAxis);
                for (let index = 0; index < numberOfSections; index++) {
                    topElement.appendChild(sections[index]);
                }
            }
            debug.innerHTML=debugText + "<br>nPoints:" + options.dataViews[0].table.rows.length;
        }
        catch(e){
            debug.innerHTML="ERROR:" + JSON.stringify(e);
        }
        if (this.settings.dataPoint.debug==true)
        {
            topElement.appendChild(debug);
        }
        this.target.innerHTML=topElement.outerHTML;

    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}