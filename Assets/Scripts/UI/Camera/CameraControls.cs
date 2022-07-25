using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CameraControls : MonoBehaviour
{

    [SerializeField]
    private GameObject[] cameras;

    [SerializeField]
    private int index;
 
    
void Start()
    {
        // store all the Camera objects inside the Parent Object and add them to an index
        cameras = new GameObject[transform.childCount];
        // fill in the cameras
    for (int i =0;  i< transform.childCount; i++)
        {
            cameras[i] = transform.GetChild(i).gameObject;
        }

    // toggle off the cameras
    foreach(GameObject cam in cameras)
        {
            cam.SetActive(false);
        }
        // toggle on the first one
        if (cameras[0])
        {
            cameras[0].SetActive(true);
        }
    }

  
    public void SwitchCamera()
    {
        //Toggle off the current camera
        cameras[index].SetActive(false);
        index++;
        // Swtich between cameras based on the index it is at
        if (index < 0)
        {
            index = cameras.Length - 1;

        }
        if (index == cameras.Length)
        {
            index = 0;
        }
        //Toggle on the next camera
        cameras[index].SetActive(true);
    }
}
