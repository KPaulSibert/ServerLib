import SQ from "sequelize";
const {Sequelize} = SQ
export const Models = []
export {SQ}
export function initDB(path){
    const seq = new Sequelize(path)
    for(const model of Models){
        model.init(seq)
    }
    seq.sync({alter:true})
    return seq
}