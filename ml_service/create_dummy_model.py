import tensorflow as tf
from tensorflow.keras import layers, models
import os

def build_dummy_model():
    # Use MobileNetV2 structure but initialize with random weights (weights=None)
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(150, 150, 3),
        include_top=False,
        weights=None
    )
    x = layers.GlobalAveragePooling2D()(base_model.output)
    output = layers.Dense(4, activation='softmax')(x)
    model = models.Model(inputs=base_model.input, outputs=output)
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

if __name__ == '__main__':
    print("Building dummy MobileNetV2 model...")
    model = build_dummy_model()
    output_path = os.path.join(os.path.dirname(__file__), 'alzheimer_model_mobilenetv2.h5')
    model.save(output_path)
    print(f"Model saved successfully at: {output_path}")
