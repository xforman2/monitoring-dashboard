import { QueryVariable, SceneDataTransformer, SceneQueryRunner } from "@grafana/scenes";
import { SQL_DATASOURCE } from "../../constants";

export const users = new QueryVariable({
    name: 'user',
    label: 'User Name',
    datasource: SQL_DATASOURCE,
    query: "SELECT xlogin from User",
    sort: 1,
    isMulti: false,
    includeAll: false
});
  
  
export const gpuCountQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT RecordTimeCreated as time, Command, pe.GpuCount
        FROM ProcessEvidence pe
        JOIN User u ON Id = RecordUserId
        JOIN Machine m ON RecordMachineMac = MAC
        WHERE m.Name = '${text}' AND xlogin = '$user' AND $__timeFilter(RecordTimeCreated) 
        ORDER BY time`
    }],

});

  
export const nicenessQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT RecordTimeCreated as time, Command, pe.Niceness
        FROM ProcessEvidence pe
        JOIN User ON Id = RecordUserId
        JOIN Machine m ON RecordMachineMac = MAC
        WHERE m.Name = '${text}' AND xlogin = '$user' AND $__timeFilter(RecordTimeCreated) 
        ORDER BY time`
    }],

});
  
export const vramQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT RecordTimeCreated as time, Command, pe.OverallGPUVram
        FROM ProcessEvidence pe
        JOIN User ON Id = RecordUserId
        JOIN Machine m ON RecordMachineMac = MAC
        WHERE m.Name = '${text}' AND xlogin = '$user' AND $__timeFilter(RecordTimeCreated) 
        ORDER BY time`
    }],

});

export const cpuTimeQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT RecordTimeCreated as time, Command, TIME_TO_SEC(pe.CPUTime) as CPUTime
        FROM ProcessEvidence pe
        JOIN User ON Id = RecordUserId
        JOIN Machine m ON RecordMachineMac = MAC
        WHERE m.Name = '${text}' AND xlogin = '$user' AND $__timeFilter(RecordTimeCreated) 
        ORDER BY time`
    }],

});
  


export const transformedData = (query: SceneQueryRunner, field: string) => new SceneDataTransformer({
    $data: query,
    transformations: [
        {
        id: 'renameByRegex',
        options: {
            regex: `${field} (.*)`,
            renamePattern: '$1',
        },
        },
        {
        id: "convertFieldType",
        options: {
            conversions: [
            {
                destinationType: "number",
                targetField: `${field}`
            }
            ],
            fields: {}
        }
        }
    ],
});
