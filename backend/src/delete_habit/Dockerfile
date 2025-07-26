FROM public.ecr.aws/lambda/python:3.11

# Copy common modules
COPY src/habits_common ${LAMBDA_TASK_ROOT}/habits_common/

# Copy function code
COPY src/delete_habit/requirements.txt ${LAMBDA_TASK_ROOT}
COPY src/delete_habit/handler.py ${LAMBDA_TASK_ROOT}

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set the handler
CMD ["handler.handler"]
