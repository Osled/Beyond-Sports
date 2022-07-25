using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TextFollowCamera : MonoBehaviour
{
    Camera cameraToLookAt;

  
    void Start()
    {
        cameraToLookAt = Camera.main;

    }


    void LateUpdate()
    {
        // force all text items to look at the main camera
        transform.LookAt(cameraToLookAt.transform);
        transform.rotation = Quaternion.LookRotation(cameraToLookAt.transform.forward);
    }
}
