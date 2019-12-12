"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";

import { ColorSettings } from "./ColorSettings";
import { FontSettings } from "./FontSettings";
import { ChartConfiguration } from "./ChartConfiguration";

export class Settings extends dataViewObjectsParser.DataViewObjectsParser {
  public colorsSelection: ColorSettings = new ColorSettings();
  public fontSelection: FontSettings = new FontSettings();
  public chartConfiguration: ChartConfiguration = new ChartConfiguration();
}

