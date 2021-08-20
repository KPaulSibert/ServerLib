import SQ from "sequelize";
const {Sequelize} = SQ
export const Models = []
export var DB = null;
export function initDB(path){
    DB = new Sequelize(path)
    for(const model of Models){
        model.init(DB)
    }
}