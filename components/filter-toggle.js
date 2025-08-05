import { useState, useEffect } from 'react';


export const FilterToggle = ({dateFilterDirection, dateFilter, columnValue, callback}) => {

  const [direction, setDirection]=useState(dateFilterDirection?dateFilterDirection:'dsc')
  const [filter, setFilter]=useState(dateFilter)


  useEffect(()=>{

    if (dateFilterDirection && dateFilter===columnValue){
      setDirection(dateFilterDirection)
    }

  },[dateFilterDirection])

  useEffect(()=>{
    if (dateFilter){
      setFilter(dateFilter)
    }

  },[dateFilter])


  const buttonClick = (direction) => {
    console.log('buttonClick',direction, columnValue )
    callback(direction, columnValue)
  }



  return(
    <div style={{marginLeft: 'auto'}} className={`${dateFilter===columnValue? 'active':''} ${'date_filter'}`}>
      {direction === 'asc'?(
        <div style={{display:'flex', alignItems:'center'}} onClick={() => buttonClick('dsc')}>
          <img style={{maxWidth:'25px'}} src={dateFilter===columnValue? "/arrow_upward_active.svg" : "/arrow_upward.svg" }/>
        </div>
        ):(
          <div style={{display:'flex', alignItems:'center'}} onClick={() => buttonClick('asc')}>
            <img style={{maxWidth:'25px'}} src={dateFilter===columnValue? "/arrow_downward_active.svg" : "/arrow_downward.svg" }/>
          </div>
        )
      }
    </div>
  )
}
