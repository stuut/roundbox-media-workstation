'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import axios from "axios";
import { showSuccess } from '@/lib/toast';
import { showError } from '@/lib/toast';
import { showInfo } from '@/lib/toast';
import { addFeed } from '@/lib/supabase';





export const AddAFeed = ({}) => {

  const [label, setLabel] = useState('')

  const onSubmit = (e) => {
     e.preventDefault();
    console.log('submit')

  }

return(
    <div>
      <form onSubmit={onSubmit}>
        <input
          id='label'
          type='text'
          className={'form-input'}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='label'
          required
        />
        <button className='btn primary' type="submit">Submit</button>
      </form>
    </div>
  )
}
