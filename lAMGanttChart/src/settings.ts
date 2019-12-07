"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
      public dataPoint: dataPointSettings = new dataPointSettings();
      }

    export class dataPointSettings {
      public BACKGROUND_COLOR_ODD : string = "#eeeeee";
      public BACKGROUND_COLOR_EVEN : string = "white";
      public BORDER_COLOR : string = "#dddddd";
      public BARHEIGHT : number = 28;
      public BARPADDING : number = 5;
      public FONTTITLE : number = 10;
      public FONTOWNER : number = 10;
      public FONTMONTH : number = 10;
      public FONTYEAR : number = this.FONTMONTH+2;
      public INITIALDATE : string = "";
      public FINALDATE : string = "";
      public TAGCOLOR:string ="#bbbbbb";
      public ORDERBYPI:boolean=false;

      public debug:boolean=false;
}

