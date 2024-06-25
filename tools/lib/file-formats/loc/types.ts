export interface LocDocument {
  resources: LocResources
}

export interface LocResources {
  string: LocString[]
}

export interface LocString {
  props: Record<string, string>
  value: string
}

export interface LocDict {
  [key: string]: LocEntry
}

export interface LocEntry {
  attrs: Record<string, string>
  value: string
}

// <resources xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
// 	<string key="01_CaptainThorpe_title">Englischer Freibeuter</string>
// 	<string key="01_CaptainThorpe">Kapitän Aldous Thorpe</string>
// 	<string key="01_Reese_WW_title">Wächter aus Windkreis</string>
// 	<string key="01_Reese_MB_title">Wächter von Königsfels</string>
// 	<string key="01_Reese">Leyson Reese</string>
// 	<string key="01_Grace_title">Piratin</string>
// 	<string key="01_Grace">Grace O'Malley</string>
// </resources>

