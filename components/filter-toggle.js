import { useState, useEffect } from 'react';


export const FilterToggle = ({dateFilterDirection, dateFilter, columnValue, callback}) => {

  console.log('dateFilter', dateFilter)
  console.log('columnValue', columnValue)
  const [direction, setDirection]=useState(dateFilterDirection?dateFilterDirection:'dsc')
  const [filter, setFilter]=useState(dateFilter)


  useEffect(()=>{

    if (dateFilterDirection && dateFilter===columnValue){
      setDirection(dateFilterDirection)
    }

  },[dateFilterDirection])

  useEffect(()=>{
    console.log('dateFilter', dateFilter)
    if (dateFilter){
      setFilter(dateFilter)
    }

  },[dateFilter])


  const buttonClick = (direction) => {
    callback(direction, columnValue)
  }



  return(
    <div style={{marginLeft: 'auto'}} className={`${dateFilter===columnValue? 'active':''} ${'date_filter'}`}>
      {direction === 'asc'?(
        <div onClick={() => buttonClick('dsc')}>
          Asc
        </div>
        ):(
          <div onClick={() => buttonClick('asc')}>
            Dsc
          </div>
        )
      }
    </div>
  )
}
