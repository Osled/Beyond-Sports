using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Cameramaovement : MonoBehaviour
{
    private float moveSpeed = 0.5f;
    private float scrollSpeed = 10f;

    float horizontalInput;
    float verticalInput;
    float wheelInput;

    void Update()
    {
        horizontalInput = Input.GetAxisRaw("Horizontal");
        verticalInput = Input.GetAxisRaw("Vertical");
        wheelInput = Input.GetAxis("Mouse ScrollWheel");
    }

    void FixedUpdate()
    {
        // use axis input to move the camera horzantally
        if (Input.GetAxisRaw("Horizontal") != 0 || verticalInput != 0)
        {
            transform.position += moveSpeed * new Vector3(horizontalInput, 0, verticalInput);
        }
        // use the mouse scrool to zoom/ move the camera vertically
        if (Input.GetAxis("Mouse ScrollWheel") != 0)
        {
            transform.position += scrollSpeed * new Vector3(0, -Input.GetAxis("Mouse ScrollWheel"), 0);
        }
    }

}
